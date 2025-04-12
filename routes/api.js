const {checkLoggedIn,logoutUser,postQuestion,markSolved,skip}=require("../controllers/api");
const express=require("express");
const router=express.Router();
router.get("/admin",checkLoggedIn);
router.post("/logout",logoutUser);
router.post("/addQuestion",postQuestion);
router.patch("/solved",markSolved);
router.patch("/skip",skip);
module.exports=router;