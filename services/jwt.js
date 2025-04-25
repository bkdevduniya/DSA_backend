const jwt = require("jsonwebtoken");
const secret="2@@@#672636112$#$A5q6521752`1qa87435";

const generateToken=(user)=>{
    const token=jwt.sign({userId:user._id,email:user.email,name:user.username,profilePic:user.profilePic,level:user.level,role:user.role},secret,{expiresIn:'1w'});
    return token;
};

const verifyToken=(token)=>{
    const user=jwt.verify(token,secret);
    return user;
};

module.exports={generateToken,verifyToken};