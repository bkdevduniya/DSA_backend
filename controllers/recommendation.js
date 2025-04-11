const users=require("../models/users");
const tokens=require("../models/tokens");
const questions=require("../models/questionBank");
const {verifyToken}=require("../services/jwt");

const recommend=async (req,res)=>{

    const token=req.cookies.userToken;
    if(!token) return res.json({status:"user logged out"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.json({status:"user logged out"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.json({status:"user not found"});
    const question=await user.getRecommendation();
    console.log(question);
    if(!question) return res.json({status:"no question found"});
    console.log(question);
    return res.json({status:"success",question:question});
};

module.exports=recommend;