const {verifyToken}=require('../services/jwt');
const users=require('../models/users');

const restrictUnkownUsers=async (req,res,next)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.redirect("http://localhost:5173/login.html");
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.redirect("http://localhost:5173/login.html");
    req.userDetails=user;
    next();
    }
    catch(err){
        console.log(err);
        return res.redirect("http://localhost:5173/login.html");
    }
    
};

module.exports=restrictUnkownUsers;