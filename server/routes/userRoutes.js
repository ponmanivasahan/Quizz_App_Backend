const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/authorizeRole");

router.get("/profile",verifyToken,(req,res)=>{
    res.status(200).json({
        message:"Profile Data",
        user:req.user
    })
})
router.get("/admin",verifyToken,authorizeRole("admin"),(req,res)=>{
    res.status(200).json({
        message:"Admin Data",
        user:req.user
    })
})
module.exports=router;