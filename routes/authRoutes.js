const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  login,
  logout,
  me,
  register,
  resendRegistrationOtp,
  verifyRegistrationOtp,
} = require("../controllers/authController");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.",
  },
});

router.get("/me", me);
router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyRegistrationOtp);
router.post("/resend-otp", authLimiter, resendRegistrationOtp);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

module.exports = router;
