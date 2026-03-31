const express = require("express");
const {
  addItem,
  calculateShipping,
  checkout,
  getCurrentCart,
  removeItem,
  updateItem,
} = require("../controllers/cartController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", getCurrentCart);
router.post("/items", addItem);
router.patch("/items/:itemId", updateItem);
router.delete("/items/:itemId", removeItem);
router.post("/shipping-quote", calculateShipping);
router.post("/checkout", checkout);

module.exports = router;
