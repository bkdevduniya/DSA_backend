const {verifyToken}=require('../services/jwt');
const users=require('../models/users');
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
    await users.updateOne({email:user.email},{$set:{stats:user.stats}});
    return res.status(200).json({status:result});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({msg:"error"});
    }
};

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
    await users.updateOne({email:user.email},{$set:{stats:user.stats}});
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
    const searchparms=req.query;
    searchparms.difficultyMin=Number(searchparms.difficultyMin);
    searchparms.difficultyMax=Number(searchparms.difficultyMax);
    console.log(searchparms);
    let result=await questionBank.aggregate([
        {
            $match:{
            tags:searchparms.tag?searchparms.tag:{$in:[
                'array', 'string', 'linked list', 'hash table', 'two pointers', 'sorting',
                'searching', 'binary search', 'sliding window', 'heap', 'tree', 'backtracking',
                'greedy', 'depth first search', 'breadth first search', 'bit manipulation',
                'prefix sum', 'graph', 'topological_sort', 'dynamic programming', 'trie',
                'segment tree', 'fenwick_tree', 'persistent segment tree', 'sparse table',
                'number theory', 'combinatorics', 'modular arithmetic', 'game theory',
                'bitmasking', 'memoization', 'geometry', 'recursion'
              ]},
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
    result=result.map((question)=>{
        console.log(user.stats.tags[question.tags]);
      const status=user.stats.tags[question.tags]?user.stats.tags[question.tags][0].some(q=>q.title==question.title)?"solved":"unsolved":"unsolved";
    //   console.log(status);
      return {...question,status:status};
    })
    console.log(result);
    return res.status(200).json({result});
}
catch(err){
    console.log(err);
    return res.status(401).json({msg:"error"});
}
};

module.exports={checkLoggedIn,logoutUser,postQuestion,markSolved,skip,searchHandler};