const express = require("express");
const {
  getCurrentProfile,
  updateCurrentPassword,
  updateCurrentProfile,
} = require("../controllers/profileController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", getCurrentProfile);
router.patch("/", updateCurrentProfile);
router.patch("/password", updateCurrentPassword);

module.exports = router;
