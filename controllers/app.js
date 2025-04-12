const {verifyToken}=require('../services/jwt');
const users=require('../models/users');
const  tokens=require('../models/tokens');

const app=async(req,res)=>{
    try{
        const token=req.cookies.userToken;
        console.log("token",token);
        if(!token) return res.send(null);
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.send(null);
        const {name,profilePic}=verifyToken(token);
        return res.json({name:name,profilePic:profilePic});
    }catch(err){
        console.log(err);
        return res.send(null);
    }
};

module.exports=app;