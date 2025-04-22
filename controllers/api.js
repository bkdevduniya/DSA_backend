const {verifyToken,generateToken}=require('../services/jwt');
const users=require('../models/users');
const Sheets=require('../models/sheets');
const tokens=require('../models/tokens');
const questionBank=require('../models/questionBank');


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
    // console.log(questionDetails);
    const question=await questionBank.create(questionDetails);
    return res.status(200).json({msg:"question uploaded"});
    }
    catch(err){
        console.log(err);
        return res.status(400).json({msg:"question url/title already exist"});
    }
}

const createSheet=async (req,res)=>{
    try{
    
    const sheetDetails=req.body;
    console.log(sheetDetails);
    // console.log(questionDetails);
    await Sheets.create(sheetDetails);
    return res.status(200).json({msg:"sheet created"});
    }
    catch(err){
        console.log(err);
        return res.status(400).json({msg:"sheet already exist"});
    }
}

const logoutUser=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    await tokens.deleteOne({token:token});
    res.clearCookie('userToken');
   return  res.status(200).json({msg:"logout success"});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"logout error"});
    }
};

const markSolved=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.status(401).json({msg:"user not found"});
    const result=await user.solved(req.body);
    await user.save();
    // await users.updateOne({email:user.email},{$set:{stats:user.stats}});
    return res.status(200).json({status:result});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
};
const unsolved=async (req,res)=>{
    try{
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email}=verifyToken(token);
        const user=await users.findOne({email});
        if(!user) return res.status(401).json({msg:"user not found"});
        const result=await user.markUnsolved(req.body);
        await user.save();
        // await users.updateOne({email:user.email},{$set:{stats:user.stats}});
        return res.status(200).json({status:result});
        }
        catch(err){
            console.log(err);
            return res.status(401).json({msg:"error"});
        }
}

const skip=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.status(401).json({msg:"user not found"});
    const result=await user.skip(req.body);
    await user.save();
    // await users.updateOne({email:user.email},{$set:{stats:user.stats}});
    return res.status(200).json({status:result});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
};

const searchHandler=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(200).json({msg:"user not logged in"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.status(200).json({msg:"user not logged in"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.status(200).json({msg:"user not found"});
    // console.log(req.query);
    const searchparms={...req.query};
    searchparms.difficultyMin=Number(searchparms.difficultyMin);
    searchparms.difficultyMax=Number(searchparms.difficultyMax);
    console.log(searchparms);
    const tagList=[
        'array', 'string', 'linked list', 'hash table', 'two pointers', 'sorting',
        'searching', 'binary search', 'sliding window', 'heap', 'tree', 'backtracking',
        'greedy', 'depth first search', 'breadth first search', 'bit manipulation',
        'prefix sum', 'graph', 'topological_sort', 'dynamic programming', 'trie',
        'segment tree', 'fenwick_tree', 'persistent segment tree', 'sparse table',
        'number theory', 'combinatorics', 'modular arithmetic', 'game theory',
        'bitmasking', 'memoization', 'geometry', 'recursion'
      ];
    let result=await questionBank.aggregate([
        {
            $match:{
            tags:searchparms.tag?searchparms.tag:{$in:tagList},
            rating:{
                $gte:searchparms.difficultyMin?searchparms.difficultyMin:800,
                $lte:searchparms.difficultyMax?searchparms.difficultyMax:2000
            }
            }
       },
       {
        $sort:{
          rating:1
        }
       }
    ]);
    const userSearchArray=Object.values(user.stats.tags).map((qnStat) =>{
        return new Set(qnStat[0].map(q=>q.title));
    });
    
    const userSearchObj=Object.fromEntries(userSearchArray.map((set,i)=>[tagList[i],set]));
     

    result=result.map((question)=>{
        // console.log(user.stats.tags[question.tags]);
      const status=userSearchObj[question.tags].has(question.title)?"solved":"unsolved";
    //   console.log(status);
      return {...question,status:status};
    })
    // console.log(result);
    return res.status(200).json({result});
}
catch(err){
    console.log(err);
    return res.status(401).json({msg:"error"});
}
};

const  userStats=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.status(401).json({msg:"user not found"});
    return res.status(200).json(user);
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}

const userCredentials=async (req,res)=>{
    try{
    const token=req.cookies.userToken;
    if(!token) return res.status(401).json({msg:"user not logged in"});
    const tokenStatus=await tokens.findOne({token});
    if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
    const {email}=verifyToken(token);
    const user=await users.findOne({email});
    if(!user) return res.status(401).json({msg:"user not found"});
    return res.status(200).json({email:user.email,name:user.username,level:user.level,password:user.password});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}

const handleChangedProfileDetails = async (req, res)=>{
    try{
        const {email,password,username}=req.body;
        if(!email || !password || !username) return res.status(401).json({msg:"no change detected"});
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const user=await users.findOneAndUpdate({email:email},{$set:{...req.body}},{new:true});
        if(!user) return res.status(401).json({msg:"user not found"});
        console.log(user);
        await tokens.findOneAndDelete({token});
        res.clearCookie('userToken');
        const newToken=generateToken(user);
        await tokens.create({token:newToken});
        res.cookie('userToken',newToken,{httpOnly:true,secure:true,sameSite:'none'});
        return res.status(200).json({email:user.email,username:user.username,password:user.password});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}

const handleSheetStatusChange=async (req,res)=>{
    try{

        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email}=verifyToken(token);
        const user=await users.findOne({email});
        if(!user) return res.status(401).json({msg:"user not found"});
        const {sheetId}=req.body;
        if(!sheetId) return res.status(401).json({msg:"no change detected"});
        const newSheetStatus=user.sheets.some(sheet=>sheet==sheetId);
        console.log("sheet check:",newSheetStatus);
        if(!newSheetStatus){
            await  Sheets.updateOne({_id:sheetId},{$inc:{followers:1}});
            user.sheets.push(sheetId);
        }
        else{
            await  Sheets.updateOne({_id:sheetId},{$inc:{followers:-1}});
            user.sheets.splice(user.sheets.indexOf(sheetId),1);
        }
        user.markModified('sheets');
        await user.save();
        return res.status(200).json({status:'success'});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
};

const sheetsProvider=async (req,res)=>{
    try{
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email}=verifyToken(token);
        const user=await users.findOne({email});
        if(!user) return res.status(401).json({msg:"user not found"});
        let availableSheets=await Sheets.find({});
        // console.log(availableSheets);
        if(!availableSheets) return res.status(401).json({msg:"sheets not found"});
        availableSheets=(availableSheets).map((sheet)=>{
            let newSheetDetails={};
            newSheetDetails._id=sheet._id;
            newSheetDetails.title=sheet.title;
            newSheetDetails.description=sheet.description;
            newSheetDetails.followers=sheet.followers;
            newSheetDetails.questions=sheet.questions.length;
            return {...newSheetDetails,followStatus:user.sheets.includes(sheet._id)};
        });
        // console.log(availableSheets);
        return res.status(200).json({status:"success",sheets:availableSheets});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}

const provideSheetQuestions=async (req,res)=>{
    try{
        const token=req.cookies.userToken;
        if(!token) return res.status(401).json({msg:"user not logged in"});
        const tokenStatus=await tokens.findOne({token});
        if(!tokenStatus) return res.status(401).json({msg:"user not logged in"});
        const {email}=verifyToken(token);
        const user=await users.findOne({email});
        if(!user) return res.status(401).json({msg:"user not found"});
        const {sheetId}=req.query;
        const sheet=await Sheets.findOne({_id:sheetId});
        if(!sheet) return res.status(401).json({msg:"sheet not found"});
        let sheetMeta={};
        sheetMeta.title=sheet.title;
        sheetMeta.description=sheet.description;
        sheetMeta.followers=sheet.followers;
        return res.status(200).json({status:"success",meta:sheetMeta,questions:sheet.questions});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
}



module.exports={checkLoggedIn,logoutUser,postQuestion,createSheet,markSolved,unsolved,skip,searchHandler,userStats,userCredentials,handleChangedProfileDetails,handleSheetStatusChange,sheetsProvider,provideSheetQuestions};
