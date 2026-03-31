const {
  addItemToCart,
  calculateShippingForCart,
  getCart,
  removeItemFromCart,
  updateItemInCart,
} = require("../services/cartService");
const { createOrderFromCart } = require("../services/orderService");
const { respondWithError } = require("../utils/respondWithError");

async function getCurrentCart(req, res) {
  try {
    const cart = await getCart(req.session.userId);
    return res.status(200).json(cart);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function addItem(req, res) {
  try {
    const cart = await addItemToCart({
      userId: req.session.userId,
      productId: Number.parseInt(req.body.productId, 10),
      size: req.body.size,
      color: req.body.color,
      quantity: req.body.quantity,
    });

    return res.status(201).json({
      message: "Produto adicionado ao carrinho.",
      ...cart,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function updateItem(req, res) {
  try {
    const cart = await updateItemInCart({
      userId: req.session.userId,
      cartItemId: Number.parseInt(req.params.itemId, 10),
      quantity: req.body.quantity,
    });

    return res.status(200).json({
      message: "Carrinho atualizado.",
      ...cart,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function removeItem(req, res) {
  try {
    const cart = await removeItemFromCart({
      userId: req.session.userId,
      cartItemId: Number.parseInt(req.params.itemId, 10),
    });

    return res.status(200).json({
      message: "Item removido do carrinho.",
      ...cart,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function checkout(req, res) {
  try {
    const result = await createOrderFromCart({
      userId: req.session.userId,
      checkoutData: req.body,
    });

    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function calculateShipping(req, res) {
  try {
    const result = await calculateShippingForCart({
      userId: req.session.userId,
      zipCode: req.body.zipCode,
    });

    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = {
  addItem,
  calculateShipping,
  checkout,
  getCurrentCart,
  removeItem,
  updateItem,
};
