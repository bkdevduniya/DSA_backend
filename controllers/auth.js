const users=require('../models/users');
const tokens=require('../models/tokens');
const {generateToken,verifyToken}=require('../services/jwt');
const { sign } = require('jsonwebtoken');

const signup=async(req,res)=>{
    // console.log(req.body);
    // let formdata={};
    // formdata.email=req.body.email;
    // formdata.password=req.body.password;
    // formdata.username=req.body.name; 
    // formdata.level=req.body.level;
    try{
        const tokenprv=req.cookies.userToken;
    if(tokenprv){
        const tokenStatus=await tokens.deleteOne({token:tokenprv});
        // console.log("token cleared before login",verifyToken(tokenprv));
        res.clearCookie('userToken');
    }
        const user=await users.create(req.body);
        console.log("created user",user);
       const token=generateToken(user);
       await tokens.create({userId:user._id,token:token});
       res.cookie('userToken',token,{httpOnly:true,secure:true,sameSite:'none'});
       return res.status(201).json({msg:"user created"})
    }catch(err){
        console.log(err);
        return res.status(400).json({msg:"user already exist with this email"});
    }
};

const login=async(req,res)=>{
    try{
    const tokenprv=req.cookies.userToken;
    if(tokenprv){
        const tokenStatus=await tokens.deleteOne({token:tokenprv});
        // console.log("token cleared before login",verifyToken(tokenprv));
        res.clearCookie('userToken');
    }
    // console.log(req.body);
    const user=await users.findOne({email:req.body.email});
    if(!user) return res.status(404).json({msg:"invalid credentials"});
    const match=await user.matchPassword(req.body.password);
    if(!match){
        return  res.status(404).json({msg:"invalid credentials"});
    }
    const token=generateToken(user);
    await tokens.create({userId:user._id,token:token});
    res.cookie('userToken',token,{httpOnly:true,secure:true,sameSite:'none'});
    return res.status(200).json({msg:"login success"});;
    }
    catch(err){
        console.log(err);
        return res.status(404).json({msg:"invalid credentials"});
    }
};

const changePassword=async(req,res)=>{
    try{
        const {email}=req.body;
        const user=await users.findOne({email:email});
        if(!user) return res.status(401).json({msg:"user not found"});
        user.password=req.body.password1;
        user.markModified('password');
        await user.save();
        return res.status(200).json({status:"success"});
    }catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}

module.exports={signup,login,changePassword};