const express = require("express");
const {
  createCurrentOrder,
  getCurrentUserOrderDetails,
  listCurrentUserOrders,
} = require("../controllers/orderController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.post("/", createCurrentOrder);
router.get("/", listCurrentUserOrders);
router.get("/:id", getCurrentUserOrderDetails);

module.exports = router;
