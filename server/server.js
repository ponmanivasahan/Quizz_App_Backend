const express = require("express");
require("dotenv").config();
const cors = require("cors");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes")
const quizRoutes = require("./routes/quizRoutes");
const questionRoutes = require("./routes/questionRoutes");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user",userRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
app.get("/",(req,res)=>{
    res.send("Quiz Management API running")
});
const port = process.env.PORT || 5000;
app.listen(port,()=>{
    console.log(`Server running on port${port}`)
});
