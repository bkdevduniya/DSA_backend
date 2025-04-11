const {signup,login}=require('../controllers/auth');
const express=require('express');
const router=express.Router();

router.route("/signup").post(signup);
router.route("/login").post(login);

module.exports=router;