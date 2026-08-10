const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.get("/",(req,res)=>{
    res.send("Auth route is running")
});
router.post("/register",register);
router.post("/login",login);
router.get("/me", protect, getMe);

module.exports = router;