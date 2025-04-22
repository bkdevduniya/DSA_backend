const users=require("../models/users");
const tokens=require("../models/tokens");
const questions=require("../models/questionBank");
const predict=require("../ml/load");
const {verifyToken}=require("../services/jwt");
const questionBank = require("../models/questionBank");

const initializeStats=async (user)=>{
 try{
const questionStatInitalisation= await questions.aggregate([
    {
        $sort:{
            rating:1
        }
    },
    {
        $project:{
            title:1,
            tags:1,
            difficulty:1,
            rating:1
        }
    }
]);
// console.log("questionStatInitalisation",questionStatInitalisation);
if(!user.stats.tags){
    user.stats.tags={};
}
   questionStatInitalisation.forEach(({tags,title,rating,difficulty})=>{
       if(!user.stats.tags[tags])
        user.stats.tags[tags]=[[],[],0,0,[]];
        user.stats.tags[tags][1].push({title,rating});
        user.stats.tags[tags][3]+=(difficulty=="easy"?1:difficulty=="medium"?2:3);
    });
}
catch(err){
    console.error(err);
}
    // console.log("this.stats.tags",user.stats.tags);
    return ;
};


const getRecommendation= async (user)=>{
    if(!user.stats.initialised){
    console.log("initializing stats");
    await initializeStats(user);
    user.stats.initialised=true;
    await users.updateOne({email:user.email},{$set:{stats:user.stats}});
    }
    const arr = Object.values(user.stats.tags);
    // console.log("arr",arr);
    const inputForModel = arr.map((qnStat) =>{return (qnStat[3]!=0?(qnStat[2]/qnStat[3])*100:0);});
    console.log("input for model",inputForModel);
    let outputForModel = await predict(inputForModel);
   console.log("model output",outputForModel);
//    if(outputForModel){
//        outputForModel=outputForModel.toLowerCase();
//        console.log("output for model lower",outputForModel);
//    }
    return outputForModel;
  };



const recommend=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return {status:"user logged out"};
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return {status:"invaid user"};
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return {status:"user not found"};
    // console.log("user",user);
    const outputForModel=await getRecommendation(user);
    console.log(outputForModel);
    let finalOutput;
    if (user.stats.tags[outputForModel][1].length >= 1) {
      finalOutput = user.stats.tags[outputForModel][1][0].title;
    }
    else if(user.stats.tags[outputForModel][4].length>=1){
        finalOutput=user.stats.tags[outputForModel][4][0].title;
    }
    else{
        finalOutput="topic complete";
    }
    console.log("question",finalOutput);
    if(!finalOutput) return res.json({status:"no question found"});
    else if(finalOutput=="topic complete") return res.json({status:"topic complete"});
    const questionDetails=await questions.findOne({title:finalOutput});
    return res.json({status:"success",questions:[questionDetails]});
    }
    catch(err){
        console.log(err);
        return res.json({status:"error"});
    }
};


const recommendMultipleQuestions=async (req,res)=>{
    try{
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email}=verifyToken(token);
        const user=await users.findOne({email});
        if(!user) return res.status(401).json({msg:"user not found"});
        const outputForModel=await getRecommendation(user);
        let finalOutput=[],easyQuestions=[],mediumQuestions=[],hardQuestions=[],curScore=user.stats.tags[outputForModel][2],totalScore=user.stats.tags[outputForModel][3];
        let availbleQuestions,percentScore=totalScore>0?(curScore/totalScore)*100:0;
        if (user.stats.tags[outputForModel][1].length >= 1) {
            availbleQuestions = user.stats.tags[outputForModel][1];
          }
          else if(user.stats.tags[outputForModel][4].length>=1){
            availbleQuestions=user.stats.tags[outputForModel][4];
          }
          else{
              availbleQuestions=[];
              finalOutput=[];
          }

        if(availbleQuestions.length>0){
        for(let i=0;i<availbleQuestions.length;i++){
           const details=await questionBank.findOne({title:availbleQuestions[i].title});
           if(details.difficulty=='easy')easyQuestions.push(details);
           else if(details.difficulty=='medium')mediumQuestions.push(details);
           else hardQuestions.push(details);
        }
        console.log("easy :",easyQuestions);
        console.log("medium :",mediumQuestions);
        console.log("hard :",hardQuestions);
        // console.log("availble qns :",availbleQuestions);
        const randomNumberOfQuestions=20*Math.random();
        let numberOfEasyquestions,numberOfMediumquestions,numberOfHardquestions;
        if(percentScore<=30){
            numberOfEasyquestions=(70/100)*randomNumberOfQuestions;
            numberOfMediumquestions=(15/100)*randomNumberOfQuestions;
            numberOfHardquestions=randomNumberOfQuestions-(numberOfEasyquestions+numberOfMediumquestions);
        }
        else if(percentScore>30&&percentScore<=50){
            numberOfEasyquestions=(50/100)*randomNumberOfQuestions;
            numberOfMediumquestions=(30/100)*randomNumberOfQuestions;
            numberOfHardquestions=randomNumberOfQuestions-(numberOfEasyquestions+numberOfMediumquestions);
        }
        else if(percentScore>50&&percentScore<=70){
            numberOfEasyquestions=(30/100)*randomNumberOfQuestions;
            numberOfMediumquestions=(50/100)*randomNumberOfQuestions;
            numberOfHardquestions=randomNumberOfQuestions-(numberOfEasyquestions+numberOfMediumquestions);
        }
        else if(percentScore>70&&percentScore<=80){
            numberOfEasyquestions=(15/100)*randomNumberOfQuestions;
            numberOfMediumquestions=(60/100)*randomNumberOfQuestions;
            numberOfHardquestions=randomNumberOfQuestions-(numberOfEasyquestions+numberOfMediumquestions);
        }
        else{
          numberOfEasyquestions=(10/100)*randomNumberOfQuestions;
          numberOfMediumquestions=(40/100)*randomNumberOfQuestions;
          numberOfHardquestions=randomNumberOfQuestions-(numberOfEasyquestions+numberOfMediumquestions);
        }
        for(let i=0;i<Math.min(numberOfEasyquestions,easyQuestions.length);i++){
            finalOutput.push(easyQuestions[i]);
        }
        for(let i=0;i<Math.min(numberOfMediumquestions,mediumQuestions.length);i++){
            finalOutput.push(mediumQuestions[i]);
        }
        for(let i=0;i<Math.min(numberOfHardquestions,hardQuestions.length);i++){
            finalOutput.push(hardQuestions[i]);
        }
        
        return res.status(200).json({msg:"success",questions:finalOutput});
    }
     return res.status(404).json({msg:"no questions found"});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
};

module.exports={recommend,recommendMultipleQuestions};