const users=require("../models/users");
const tokens=require("../models/tokens");
const questions=require("../models/questionBank");
const predict=require("../ml/load");
const {verifyToken}=require("../services/jwt");

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
console.log("questionStatInitalisation",questionStatInitalisation);
if(!user.stats.tags){
    user.stats.tags={};
}
   questionStatInitalisation.forEach(({tags,title,rating,difficulty})=>{
        if(!user.stats.tags[tags]){
            console.log("tag",tags);
            user.stats.tags[tags]=[[],[],0,0,[]];
        }
        user.stats.tags[tags][1].push({title,rating});
        user.stats.tags[tags][3]+=(difficulty=="easy"?1:difficulty=="medium"?2:3);
    });
}
catch(err){
    console.error(err);
    return;
}
    console.log("this.stats.tags",user.stats.tags);
    return ;
};


const getRecommendation = async (user)=>{
    if(!user.stats.initialised){
    console.log("initializing stats");
    await initializeStats(user);
    user.stats.initialised=true;
    await users.updateOne({email:user.email},{$set:{stats:user.stats}});
    }
    const arr = Object.values(user.stats.tags);
    console.log("arr",arr);
    const inputForModel = arr.map((qnStat) =>{return (qnStat[3]!=0?(qnStat[2]/qnStat[3])*100:0);});
    console.log("input for model",inputForModel);
    let outputForModel = await predict(inputForModel);
   console.log("model output",outputForModel);
//    if(outputForModel){
//        outputForModel=outputForModel.toLowerCase();
//        console.log("output for model lower",outputForModel);
//    }
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
    return finalOutput;
  };

const recommend=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return {status:"user logged out"};
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return {status:"invaid user"};
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return {status:"usr not found"};
    console.log("user",user);
    const question=await getRecommendation(user);
    
    console.log("question",question);
    if(!question) return res.json({status:"no question found"});
    else if(question=="topic complete") return res.json({status:"topic complete"});
    const questionDetails=await questions.findOne({title:question});
    return res.json({status:"success",question:questionDetails});
    }
    catch(err){
        console.log(err);
        return res.json({status:"error"});
    }
};

module.exports=recommend;
