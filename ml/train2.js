const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

// Paths
const modelDir = path.resolve('model');
const modelJsonPath = path.join(modelDir, 'model.json');
const weightsPath = path.join(modelDir, 'weights.bin');
const csvPath = path.resolve('dsa_dataset.csv');

// Ensure model directory exists
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir);
}

// Constants
const labelColumn = 'Recommended_Topic_Label';
const numFeatures = 33;
const numClasses = 33;
const csvUrl = `file://${csvPath}`;

// Custom save handler
const customSaveHandler = {
  async save(modelArtifacts) {
    fs.writeFileSync(modelJsonPath, JSON.stringify({
      modelTopology: modelArtifacts.modelTopology,
      weightsManifest: [{
        paths: ['weights.bin'],
        weights: modelArtifacts.weightSpecs,
      }]
    }));
    fs.writeFileSync(weightsPath, Buffer.from(modelArtifacts.weightData));
    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
        modelTopologyBytes: JSON.stringify(modelArtifacts.modelTopology).length,
        weightSpecsBytes: JSON.stringify(modelArtifacts.weightSpecs).length,
        weightDataBytes: modelArtifacts.weightData.byteLength,
      }
    };
  }
};

(async () => {
  // Load dataset
  const csvDataset = tf.data.csv(csvUrl, {
    columnConfigs: {
      [labelColumn]: { isLabel: true }
    },
    hasHeader: true
  });

  // Preprocessing
  const dataset = csvDataset.map(({ xs, ys }) => {
    const features = Object.values(xs).map(Number);
    const label = parseInt(Object.values(ys)[0], 10);
    return {
      xs: tf.tensor1d(features),
      ys: tf.tensor1d([label])
    };
  }).batch(32);

  // Define deeper model
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [numFeatures], units: 128, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.4 }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  // Train
  console.log('⏳ Training model...');
  await model.fitDataset(dataset, { epochs: 10 });
  console.log('✅ Model training complete.');

  // Save model
  await model.save({ save: customSaveHandler.save });
  console.log('✅ Model saved to ./model');
})();
