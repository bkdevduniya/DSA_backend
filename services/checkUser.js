const users=require("../models/users");
const {verifyToken}=require("../services/jwt");
const tokens=require("../models/tokens");
const checkUser=async (token)=>{
    try{
       
        console.log(user);
        return {status:"success",user:user};
    }
    catch(err){
        console.log(err);
        return {status:"error"};
    }
};

module.exports=checkUser;