const {checkLoggedIn,logoutUser,postQuestion}=require("../controllers/api");
const express=require("express");
const router=express.Router();
router.get("/admin",checkLoggedIn);
router.post("/logout",logoutUser);
router.post("/addQuestion",postQuestion);
module.exports=router;