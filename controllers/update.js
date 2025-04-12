const users=require("../models/users");
const questions=require("../models/questionBank");

const markSolve=(req,res)=>{
        const problemData=req.query;
        const userDetails=req.cookies.userToken;
        
}