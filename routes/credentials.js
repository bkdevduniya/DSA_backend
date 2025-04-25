const {updatePass,updateEmail,credentials}=require("../controllers/credentials");
const express=require("express");
const router=express.Router();
router.get("/",credentials);
router.put("/updatePass",updatePass);
router.put("/updateEmail",updateEmail);
module.exports=router;