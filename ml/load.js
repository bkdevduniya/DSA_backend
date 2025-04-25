const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

// DSA tags list (index-based)
const dsaTags =[
  'array', 'string', 'linked list', 'hash table', 'two pointers', 'sorting','sliding window',
  'searching', 'binary search','prefix sum', 'recursion','memoization', 'tree', 'heap', 'backtracking',
  'greedy', 'depth first search', 'breadth first search','bitmasking',
  , 'topological sort', 'dynamic programming', 'graph', 'trie', 'geometry',
  'segment tree', 'fenwick tree', 'persistent segment tree', 'sparse table',
  'number theory', 'combinatorics', 'modular arithmetic', 'game theory','bit manipulation'
];
                    
const modelDir = path.resolve(__dirname, 'model');
const modelJsonPath = path.join(modelDir, 'model.json');
const weightsPath = path.join(modelDir, 'weights.bin');

// Custom load handler
const customLoadHandler = {
  async load() {
    const modelJSON = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    const weightData = fs.readFileSync(weightsPath);

    return {
      modelTopology: modelJSON.modelTopology,
      weightSpecs: modelJSON.weightsManifest[0].weights,
      weightData: weightData.buffer.slice(
        weightData.byteOffset,
        weightData.byteOffset + weightData.byteLength
      )
    };
  }
};

const pred=async(input) => {
  // Step 1: Load the model
  const model = await tf.loadLayersModel({ load: customLoadHandler.load });
  console.log(' Model loaded from ./model');

  // Step 2: Input features (should match the 33 numerical features used during training)

  const inp = tf.tensor2d([input], [1, 33]);

  // Step 3: Predict
  const prediction = model.predict(inp);
  const predictedIndex = prediction.argMax(1).dataSync()[0]; // Get class with highest prob
  const predictedTag = dsaTags[predictedIndex];

  console.log(` Predicted class index: ${predictedIndex}`);
  console.log(` Predicted DSA tag: ${predictedTag}`);

  return predictedTag;
};


module.exports=pred;