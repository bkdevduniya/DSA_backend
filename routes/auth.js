const {signup,login,changePassword}=require('../controllers/auth');
const express=require('express');
const router=express.Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/changePassword").post(changePassword);

module.exports=router;