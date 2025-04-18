const {checkLoggedIn,logoutUser,postQuestion,markSolved,unsolved,skip,searchHandler}=require("../controllers/api");
const express=require("express");
const router=express.Router();
router.get("/admin",checkLoggedIn);
router.post("/logout",logoutUser);
router.post("/addQuestion",postQuestion);
router.patch("/solved",markSolved);
router.patch("/skip",skip);
router.get("/search",searchHandler);
router.patch("/unsolved",unsolved);

module.exports=router;