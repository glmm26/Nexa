const {
  createOrderFromCart,
  getOrderDetailsForUser,
  getOrdersForUser,
} = require("../services/orderService");
const { respondWithError } = require("../utils/respondWithError");

async function createCurrentOrder(req, res) {
  try {
    const result = await createOrderFromCart({
      userId: req.session.userId,
      checkoutData: req.body,
    });

    return res.status(201).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function listCurrentUserOrders(req, res) {
  try {
    const result = await getOrdersForUser(req.session.userId);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function getCurrentUserOrderDetails(req, res) {
  try {
    const result = await getOrderDetailsForUser({
      userId: req.session.userId,
      orderId: Number.parseInt(req.params.id, 10),
    });

    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = {
  createCurrentOrder,
  getCurrentUserOrderDetails,
  listCurrentUserOrders,
};
