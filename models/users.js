const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("node:crypto");
const predict=require("../ml/load");
const questions=require("../models/questionBank");
const { $where } = require("./tokens");
const { type } = require("node:os");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: "user"
    },
    profilePic: {
        type: String,
        default: "../logos/boy.png"
    },
    level: {
        type:String,
        default: "Beginner"
    },
    status: {
        type: String,
        default: "inactive"
    },
    stats: {
        type: Object,
        default: {
          initialised: false,
          tags: {
            "array": [[], []],
            "string": [[], []],
            "linked list": [[], []],
            "hash table": [[], []],
            "two pointers": [[], []],
            "sorting": [[], []],
            "searching": [[], []],
            "binary search": [[], []],
            "sliding window": [[], []],
            "heap": [[], []],
            "tree": [[], []],
            "backtracking": [[], []],
            "greedy": [[], []],
            "depth first search": [[], []],
            "breadth first search": [[], []],
            "bit manipulation": [[], []],
            "prefix sum": [[], []],
            "graph": [[], []],
            "topological sort": [[], []],
            "dynamic programming": [[], []],
            "trie": [[], []],
            "segment tree": [[], []],
            "fenwick tree": [[], []],
            "persistent segment tree": [[], []],
            "sparse table": [[], []],
            "number theory": [[], []],
            "combinatorics": [[], []],
            "modular arithmetic": [[], []],
            "game theory": [[], []],
            "bitmasking": [[], []],
            "memoization": [[], []],
            "geometry": [[], []],
            "recursion": [[], []]
          }
        }
      }      
},{timestamps: true});

userSchema.pre('save',async function(next){
// arrow functtion should not be used with this as this will refer to the lexical scope
 if(!this.isModified('password')) return next();
const secret =randomBytes(16).toString();
const hash = createHmac('sha256', secret)
               .update(this.password)
               .digest('hex');
    this.password=hash;
    this.salt=secret;
    next();
});

userSchema.methods.initializeStats=async function(){
 try{
const questionStatInitalisation= await questions.aggregate([
    {
        $sort:{
            rating:1
        }
    },
    {
        $project:{
            title:1,
            tags:1
        }
    }
]);
console.log("questionStatInitalisation",questionStatInitalisation);
if(!this.stats.tags){
    this.stats.tags={};
}
   questionStatInitalisation.forEach(({tags,title,rating})=>{
        if(!this.stats.tags[tags]){
            console.log("tag",tags);
            this.stats.tags[tags]=[[],[]];
        }
        this.stats.tags[tags][1].push(title);
    });
}
catch(err){
    console.error(err);
}
    console.log("this.stats.tags",this.stats.tags);
};
userSchema.methods.matchPassword=async function(password){
const salt=this.salt;
const hashedPassword=this.password;
const hash = createHmac('sha256', salt)
               .update(password)
               .digest('hex');
return hash===hashedPassword;
};

userSchema.methods.solved=async function({tag,title}){
            this.stats[tag][1].shift();
            this.stats[tag][0].push(title);
            };

// recommenfation code is here
userSchema.methods.getRecommendation = async function () {
    if(!this.stats.initialised){
    await this.initializeStats();
    this.stats.initialised=true;
    }
    const arr = Object.values(this.stats.tags);
    console.log("arr",arr);
    const inputForModel = arr.map((qnStat) => qnStat[0].length);
    console.log("input for model",inputForModel);
    let outputForModel = await predict(inputForModel);
   console.log("model output",outputForModel);
   console.log(typeof outputForModel);
   if(outputForModel){
       outputForModel=outputForModel.toLowerCase();
       console.log("output for model lower",outputForModel);
   }
    let finalOutput;
    if (this.stats.tags[outputForModel][1].length >= 1) {
      finalOutput = this.stats.tags[outputForModel][1][0];
      this.stats.tags[outputForModel][1].shift();
      this.stats.tags[outputForModel][0].push(finalOutput);
    }
    return finalOutput;
  };
const users = mongoose.model("User", userSchema);
module.exports =users;