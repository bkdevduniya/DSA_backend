const recommend=require("../controllers/recommendation");
const express=require("express");   
const router=express.Router();
router.get("/",recommend);
module.exports=router;