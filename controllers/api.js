const {verifyToken}=require('../services/jwt');
const users=require('../models/users');
const tokens=require('../models/tokens');
const questionBank=require('../models/questionBank');
const { compile } = require('ejs');

const checkLoggedIn=async (req,res,next)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});

    const {role}=verifyToken(token);
    if(!role) return res.status(401).json({msg:"varification failed"});
    if(role!="admin") return res.status(401).json({admin:"flase",msg:"unauthorized user"});
    else if(role=="admin") return res.status(200).json({admin:"true",msg:"varification success"});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({admin:"false",msg:"varification failed"});
    }
};

const postQuestion=async (req,res)=>{
    try{
    const questionDetails=req.body;
    console.log(questionDetails);
    const question=await questionBank.create(questionDetails);
    return res.status(200).json({msg:"question uploaded"});
    }
    catch(err){
        console.log(err);
        return res.status(400).json({msg:"question url/title already exist"});
    }
}

const logoutUser=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    await tokens.findOneAndDelete({token});
    res.clearCookie('userToken');
   return  res.status(200).json({msg:"logout success"});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"logout error"});
    }
};

module.exports={checkLoggedIn,logoutUser,postQuestion};