const {recommend,recommendMultipleQuestions}=require("../controllers/recommendation");
const express=require("express");   
const router=express.Router();
router.get("/",recommend);
router.get("/multiple",recommendMultipleQuestions);
module.exports=router;