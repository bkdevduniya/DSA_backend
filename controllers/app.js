const {verifyToken}=require('../services/jwt');
const users=require('../models/users');
const  tokens=require('../models/tokens');
const sheets=require('../models/sheets');

const app=async(req,res)=>{
    try{
        const token=req.cookies.userToken;
        // console.log("token",token);
        if(!token) return res.send(null);
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.send(null);
        const user=verifyToken(token);
        return res.json(user);
    }catch(err){
        console.log(err);
        return res.send(null);
    }
};

module.exports=app;