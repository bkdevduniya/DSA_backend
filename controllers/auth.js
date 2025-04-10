const users=require('../models/users');
const tokens=require('../models/tokens');
const {generateToken}=require('../services/jwt');
const { sign } = require('jsonwebtoken');

const signup=async(req,res)=>{
    console.log(req.body);
    // let formdata={};
    // formdata.email=req.body.email;
    // formdata.password=req.body.password;
    // formdata.username=req.body.name; 
    // formdata.level=req.body.level;
    try{
        const user=await users.create(req.body);
        console.log(user);
       
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
    console.log(req.body);
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

module.exports={signup,login};
