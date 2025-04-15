const mongoose = require("mongoose");
const users = require("./users");

const questionBankSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        unique: true
    },
    platform: {
        type: String,
        required: true,
    },
    problemUrl: {
        type: String,
        required: true,
        unique: true
    },
    tags: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    companies:{
        type: [String]
    }
},{timestamps:true});

questionBankSchema.pre('save', async function(next) {
    const usersCursor = users.find().cursor();
    for await (const user of usersCursor) {
        if(!user.stats.tags) user.stats.tags={};
        if(!user.stats.tags[this.tags]) user.stats.tags[this.tags]=[[],[],0,0,[]];
        const existingList = user.stats.tags[this.tags][1]; // unsolved list
        const updatedList = [];
        let inserted = false;
  
        for (let q of existingList) {
          if (!inserted && q.rating > this.rating) {
            updatedList.push({
              title: this.title,
              rating: this.rating
            });
            inserted = true;
          }
          updatedList.push(q);
        }
        // If it was the hardest question so far
        if (!inserted) {
          updatedList.push({
            title: this.title,
            rating: this.rating
          });
        }
        // Update just this tag
        
        user.stats.tags[this.tags][3]+=this.difficulty=="easy"?1:this.difficulty=="medium"?2:3;
        user.stats.tags[this.tags][1] = updatedList;
        console.log("difficulty",this.difficulty);
        // await user.save();
        await users.updateOne({email:user.email},{$set:{stats:user.stats}});
      } // <-- safer than updateOne to retain full document structure
    next();
  });
  
module.exports = mongoose.model("questionbank", questionBankSchema);