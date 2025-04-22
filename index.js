const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
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
const restrictUnkownUsers = require("./middlewares/restrictUnkownUsers");
const appRouter = require("./routes/app");
const apiRouter = require("./routes/api");
// app.use("/",(req, res) => res.send("hellow"));
app.use("/recommend", recommendationRouter);
app.use("/auth", noChache, authRouter);
app.use("/app", appRouter);
app.use("/api", noChache, apiRouter);
app.use("/",(req,res)=>{return res.send("hii");});
// MongoDB connection
connectDB( process.env.MONGO_URI ||"mongodb://bkmandawat06:bk6232@ac-9ossrny-shard-00-00.prtfju5.mongodb.net:27017,ac-9ossrny-shard-00-01.prtfju5.mongodb.net:27017,ac-9ossrny-shard-00-02.prtfju5.mongodb.net:27017/?replicaSet=atlas-12dx2t-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0");

// Start the server
app.listen(port, () => console.log("Server is running "));
