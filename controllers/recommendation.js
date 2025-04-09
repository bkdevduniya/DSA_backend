const users=require("../models/users");
const tokens=require("../models/tokens");
const {verifyToken}=require("../services/jwt");

const recommend=async (req,res)=>{
    const token=req.cookies.userToken;
    if(!token) return res.json({status:"user logged out"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.json({status:"user logged out"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.json({status:"user not found"});
    if(!user.recommend) return res.json({status:"no question found"});
    return res.json({status:"success",question:user.recommend});
};

module.exports=recommend;