const users=require("../models/users");
const {verifyToken,generateToken}=require("../services/jwt");
const tokens=require("../models/tokens");


const credentials=async(req,res)=>{
    try{
        const token=req.cookies.userToken;
        // console.log("token",token);
        if(!token) return res.send(null);
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.send(null);
        const {email}=verifyToken(token);
        const user=await users.findOne({email});
        if(!user) return res.send(null);
        const {username,profilePic}=user;
        return res.json({username:username,profilePic:profilePic,email:email});
    }catch(err){
        console.log(err);
        return res.send(null);
    }
};

const updatePass=async(req,res)=>{
    try{
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email}=verifyToken(token);
        const user=await users.findOne({email:email});
        if(!user) return res.status(401).json({msg:"user not found"});
        const match=await user.matchPassword(req.body.currentPassword);
        if(!match) return res.status(401).json({msg:"invalid credentials"});
        user.password=req.body.newPassword;
        user.markModified('password');
        await user.save();
        return res.status(200).json({status:"success"});
    }catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}

const updateEmail=async(req,res)=>{
    try{
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email,userId,name,level,role,profilePic}=verifyToken(token);
        await users.updateOne({email:email},{$set:{email:req.body.newEmail}});
        const newToken=generateToken({_id:userId,username:name,level:level,role:role,profilePic:profilePic,email:req.body.newEmail});
        console.log("new token",newToken,"new email",req.body.newEmail);
        res.cookie('userToken',newToken,{httpOnly:true,secure:true,sameSite:'none'});
        await tokens.updateOne({token:token},{$set:{token:newToken}});
        return res.status(200).json({status:"success"});
    }catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}


const setProfilePic=async(url,user,res,curToken)=>{
    await users.updateOne({email:user.email},{$set:{profilePic:url}});
    const newToken=generateToken({_id:user.userId,username:user.name,level:user.level,role:user.role,profilePic:url,email:user.email});
    res.cookie('userToken',newToken,{httpOnly:true,secure:true,sameSite:'none'});
    await tokens.updateOne({token:curToken},{$set:{token:newToken}});
    console.log("new token",newToken);
    return "success";
}

module.exports={updatePass,updateEmail,credentials,setProfilePic};