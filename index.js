const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {upload}=require("./services/uploads");
const {setProfilePic}=require("./controllers/credentials");
const {verifyToken}=require("./services/jwt");
const path=require("path");


const port=process.env.PORT||5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
 // Add more origins if needed

// const allowedOrigins = [
//   'https://dsa-frontend-zeta.vercel.app'
// ];

app.use(cors({
  origin:   'https://dsa-frontend-zeta.vercel.app',
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  credentials: true // allow cookies/authorization headers
}));

// const corsOptions = {
//  // Use the array of allowed origins
//   origin:["http://localhost:5173","https://dsa-frontend-zeta.vercel.app"],
//   credentials: true, // Allow credentials such as cookies
// };

// // Use CORS middleware with options *BEFORE* other middleware
// app.use(cors(corsOptions));


// No-cache middleware
const noChache = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  next();
};

// View engine setup (for ejs, if used)
app.set("view engine", "ejs");
app.set("views", "./views");

// Routes and middleware
const recommendationRouter = require("./routes/recommendation");
const connectDB = require("./connections/mongodb");
const authRouter = require("./routes/auth");
const appRouter = require("./routes/app");
const apiRouter = require("./routes/api");
const credentials=require("./routes/credentials");

app.use("/recommend", noChache,recommendationRouter);
app.use("/auth", noChache, authRouter);
app.use("/app", appRouter);
app.use("/api", noChache, apiRouter);
app.use("/credentials",credentials);

// app.use('/uploads/profile-pictures', express.static(path.join(__dirname, 'uploads/profile-pictures')));

// app.use('/static', express.static(path.join(__dirname, 'uploads')));

app.post('/uploads',upload.single('profilePicture'),async (req, res) =>{
       console.log("upload");
       const token=req.cookies.userToken;
      const user=verifyToken(token);
      await setProfilePic(`http://localhost:5000/uploads/profile-pictures/${req.filename}`,user,res,token);
      return res.json({status:"success"});
  }
  );

app.get('/uploads/profile-pictures/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads/profile-pictures', filename);
  return res.sendFile(filePath);
});
// MongoDB connection
connectDB( process.env.MONGO_URI ||"mongodb://bkmandawat06:bk6232@ac-9ossrny-shard-00-00.prtfju5.mongodb.net:27017,ac-9ossrny-shard-00-01.prtfju5.mongodb.net:27017,ac-9ossrny-shard-00-02.prtfju5.mongodb.net:27017/?replicaSet=atlas-12dx2t-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0");
// Start the server
app.listen(port, () => console.log("Server is running "));
