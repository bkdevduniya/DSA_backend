const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("node:crypto");


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
            "array": [[], [], 0, 0, []],
            "string": [[], [], 0, 0, []],
            "linked list": [[], [], 0, 0, []],
            "hash table": [[], [], 0, 0, []],
            "two pointers": [[], [], 0, 0, []],
            "sorting": [[], [], 0, 0, []],
            "searching": [[], [], 0, 0, []],
            "binary search": [[], [], 0, 0, []],
            "sliding window": [[], [], 0, 0, []],
            "heap": [[], [], 0, 0, []],
            "tree": [[], [], 0, 0, []],
            "backtracking": [[], [], 0, 0, []],
            "greedy": [[], [], 0, 0, []],
            "depth first search": [[], [], 0, 0, []],
            "breadth first search": [[], [], 0, 0, []],
            "bit manipulation": [[], [], 0, 0, []],
            "prefix sum": [[], [], 0, 0, []],
            "graph": [[], [], 0, 0, []],
            "topological sort": [[], [], 0, 0, []],
            "dynamic programming": [[], [], 0, 0, []],
            "trie": [[], [], 0, 0, []],
            "segment tree": [[], [], 0, 0, []],
            "fenwick tree": [[], [], 0, 0, []],
            "persistent segment tree": [[], [], 0, 0, []],
            "sparse table": [[], [], 0, 0, []],
            "number theory": [[], [], 0, 0, []],
            "combinatorics": [[], [], 0, 0, []],
            "modular arithmetic": [[], [], 0, 0, []],
            "game theory": [[], [], 0, 0, []],
            "bitmasking": [[], [], 0, 0, []],
            "memoization": [[], [], 0, 0, []],
            "geometry": [[], [], 0, 0, []],
            "recursion": [[], [], 0, 0, []]
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



userSchema.methods.matchPassword=async function(password){
const salt=this.salt;
const hashedPassword=this.password;
const hash = createHmac('sha256', salt)
               .update(password)
               .digest('hex');
return hash===hashedPassword;
};

userSchema.methods.solved = async function ({ tags, title, difficulty, rating }) {
    try {
      if (!tags || !title || !difficulty || !rating) return;
      const tagStats = this.stats.tags[tags];
      if (!tagStats) return;
      const [solved, unsolved,,,skipped] = tagStats;
      const checkSolved = solved.findIndex(q => q.title === title);
      const checkUnsolved = unsolved.findIndex(q => q.title === title);
      const checkSkipped = skipped.findIndex(q => q.title === title);
      if (checkSolved === -1 && checkUnsolved !== -1) {
        unsolved.splice(checkUnsolved, 1);
        solved.push({ title, rating });
        tagStats[2] += difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      } else if (checkSolved === -1 && checkSkipped !== -1) {
        skipped.splice(checkSkipped, 1);
        solved.push({ title, rating });
        tagStats[2] += difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
      }
      this.markModified('stats.tags.' + tags);
    } catch (e) {
      console.log(e);
    }
    return;
  };
  
  userSchema.methods.skip = async function ({ tags, title, rating }) {
    try {
      if (!tags || !title || !rating) return;
  
      const tagStats = this.stats.tags[tags];
      if (!tagStats) return;
  
      const [, unsolved, , , skipped] = tagStats;
  
      const indexUnsolved = unsolved.findIndex(q => q.title === title);
      const indexSkipped = skipped.findIndex(q => q.title === title);
  
      if (indexUnsolved !== -1) unsolved.splice(indexUnsolved, 1);
      if (indexSkipped === -1) skipped.push({ title, rating });
  
      this.markModified('stats.tags.' + tags);
    } catch (e) {
      console.log(e);
    }
    return;
  };
  
  userSchema.methods.markUnsolved = async function ({ tags, title, difficulty, rating }) {
    try {
      if (!tags || !title || !rating) return;
  
      const tagStats = this.stats.tags[tags];
      if (!tagStats) return;
  
      const [solved, unsolved, score] = tagStats;
  
      // Add to unsolved if not present
      if (!unsolved.some(q => q.title === title)) {
        const insertIndex = unsolved.findIndex(q => q.rating > rating);
        if (insertIndex === -1) {
          unsolved.push({ title, rating });
        } else {
          unsolved.splice(insertIndex, 0, { title, rating });
        }
      }
  
      // Remove from solved if present
      const indexSolved = solved.findIndex(q => q.title === title);
      if (indexSolved !== -1) {
        solved.splice(indexSolved, 1);
        tagStats[2] -= difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      }
  
      this.markModified('stats.tags.' + tags);
    } catch (e) {
      console.log(e);
    }
    return;
  };

const users = mongoose.model("User", userSchema);
module.exports =users;