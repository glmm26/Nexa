const express = require("express");
const { listAdminOrders, updateAdminOrder } = require("../controllers/adminController");
const {
  createProductForAdmin,
  deleteProductForAdmin,
  listAdminProducts,
  updateProductForAdmin,
  updateProductStockForAdmin,
} = require("../controllers/productController");
const { requireAdmin, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/products", listAdminProducts);
router.post("/products", createProductForAdmin);
router.put("/products/:id", updateProductForAdmin);
router.delete("/products/:id", deleteProductForAdmin);
router.patch("/products/:id/stock", updateProductStockForAdmin);
router.get("/orders", listAdminOrders);
router.put("/orders/:id/status", updateAdminOrder);

module.exports = router;
