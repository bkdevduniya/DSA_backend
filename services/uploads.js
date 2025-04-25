const multer=require("multer");
const path=require("path");
const {verifyToken}=require("./jwt");
const fs=require("fs");

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        const uploadDir=path.join(__dirname,"../uploads/profile-pictures");
        if(!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir,{recursive:true});
        }
        cb(null,uploadDir);
    },
    filename: function(req,file,cb){
        const token=req.cookies.userToken;
        const user=verifyToken(token);
        const ext=path.extname(file.originalname);
        req.filename=`${user.userId}${ext}`;
        cb(null,`${user.userId}${ext}`);
    }
});

const fileFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb(null,true);
    }else{
        cb(new Error("Only image files are allowed!"),false);
    }
};


const upload=multer({
    storage:storage,
    limits:{fileSize:2*1024*1024},//2MB limit
    fileFilter:fileFilter
});

module.exports={upload};