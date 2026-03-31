const {
  getOrdersForAdmin,
  updateOrderStatusForAdmin,
} = require("../services/orderService");
const { respondWithError } = require("../utils/respondWithError");

async function listAdminOrders(req, res) {
  try {
    const result = await getOrdersForAdmin();
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function updateAdminOrder(req, res) {
  try {
    const result = await updateOrderStatusForAdmin({
      orderId: Number.parseInt(req.params.id, 10),
      status: req.body.status,
    });

    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = {
  listAdminOrders,
  updateAdminOrder,
};
