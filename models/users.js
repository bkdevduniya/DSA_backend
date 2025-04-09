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
        default: "https://www.flaticon.com/free-icons/user"
    },
    level: {
        type:String,
        default: "Beginner"
    },
    status: {
        type: String,
        default: "inactive"
    }
},{timestamps: true});


userSchema.pre('save',function(next){
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

// recommenfation code is here
userSchema.virtual('recommend').get(function(){
    
});


const users = mongoose.model("User", userSchema);

module.exports =users;