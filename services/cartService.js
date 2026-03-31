const {
  addCartItem,
  getCartItemById,
  getProductById,
  getProductVariantBySelection,
  listCartItemsByUserId,
  removeCartItem,
  updateCartItemQuantity,
} = require("../database/database");
const { createHttpError } = require("../utils/httpError");
const { getShippingQuote } = require("./shippingService");

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function mapCartItem(item) {
  const quantity = Number(item.quantidade);
  const price = Number(item.preco);
  const lineTotal = roundMoney(quantity * price);
  const selectedVariantStock = Number(item.variante_estoque || 0);

  return {
    id: item.id,
    quantity,
    lineTotal,
    selectedSize: item.tamanho_selecionado || "",
    selectedColor: item.cor_selecionada || "",
    product: {
      id: item.produto_id,
      name: item.nome,
      description: item.descricao,
      price,
      imageUrl: item.imagem_url,
      category: item.categoria,
      stock: selectedVariantStock,
      totalStock: Number(item.estoque),
      availableSizes: Array.isArray(item.tamanhos_disponiveis) ? item.tamanhos_disponiveis : [],
      availableColors: Array.isArray(item.cores_disponiveis) ? item.cores_disponiveis : [],
    },
  };
}

function buildSummary(items, shippingQuote = null) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = roundMoney(items.reduce((total, item) => total + item.lineTotal, 0));
  const shipping = itemCount === 0 ? 0 : shippingQuote ? Number(shippingQuote.amount) : 0;
  const total = roundMoney(subtotal + shipping);

  return {
    itemCount,
    subtotal,
    shipping,
    total,
    shippingCalculated: Boolean(itemCount === 0 || shippingQuote),
  };
}

async function getCart(userId) {
  const rows = await listCartItemsByUserId(userId);
  const items = rows.map(mapCartItem);

  return {
    items,
    summary: buildSummary(items),
  };
}

async function validateVariation(product, size, color) {
  const normalizedSize = String(size || "").trim();
  const normalizedColor = String(color || "").trim().toLowerCase();

  if (!normalizedSize) {
    throw createHttpError(400, "Selecione um tamanho para continuar.");
  }

  if (!normalizedColor) {
    throw createHttpError(400, "Selecione uma cor para continuar.");
  }

  if (!product.tamanhos_disponiveis.includes(normalizedSize)) {
    throw createHttpError(400, "O tamanho selecionado nao esta disponivel.");
  }

  if (!product.cores_disponiveis.includes(normalizedColor)) {
    throw createHttpError(400, "A cor selecionada nao esta disponivel.");
  }

  const variant = await getProductVariantBySelection({
    productId: product.id,
    size: normalizedSize,
    color: normalizedColor,
  });

  if (!variant) {
    throw createHttpError(400, "Essa combinacao de tamanho e cor nao esta cadastrada.");
  }

  if (variant.estoque <= 0) {
    throw createHttpError(400, "Essa variacao esta sem estoque no momento.");
  }

  return {
    size: normalizedSize,
    color: normalizedColor,
    stock: Number(variant.estoque),
  };
}

async function addItemToCart({ userId, productId, quantity, size, color }) {
  const parsedQuantity = Number.parseInt(quantity, 10);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    throw createHttpError(400, "Informe uma quantidade valida.");
  }

  const product = await getProductById(productId);

  if (!product) {
    throw createHttpError(404, "Produto nao encontrado.");
  }

  if (product.estoque <= 0) {
    throw createHttpError(400, "Produto sem estoque no momento.");
  }

  const variation = await validateVariation(product, size, color);
  const cart = await getCart(userId);
  const totalForVariant = cart.items
    .filter(
      (item) =>
        item.product.id === productId &&
        item.selectedSize === variation.size &&
        item.selectedColor === variation.color
    )
    .reduce((total, item) => total + item.quantity, 0);
  const nextQuantity = totalForVariant + parsedQuantity;

  if (nextQuantity > variation.stock) {
    throw createHttpError(400, `Estoque disponivel para essa variacao: ${variation.stock}.`);
  }

  await addCartItem({
    userId,
    productId,
    size: variation.size,
    color: variation.color,
    quantity: parsedQuantity,
  });

  return getCart(userId);
}

async function updateItemInCart({ userId, cartItemId, quantity }) {
  const parsedQuantity = Number.parseInt(quantity, 10);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    throw createHttpError(400, "Informe uma quantidade valida.");
  }

  const cartItem = await getCartItemById({
    userId,
    cartItemId,
  });

  if (!cartItem) {
    throw createHttpError(404, "Item do carrinho nao encontrado.");
  }

  if (parsedQuantity === 0) {
    await removeCartItem({
      userId,
      cartItemId,
    });

    return getCart(userId);
  }

  const variant = await getProductVariantBySelection({
    productId: cartItem.produto_id,
    size: cartItem.tamanho_selecionado,
    color: cartItem.cor_selecionada,
  });

  if (!variant) {
    throw createHttpError(400, "A variacao deste item nao esta mais disponivel.");
  }

  if (parsedQuantity > Number(variant.estoque)) {
    throw createHttpError(
      400,
      `Estoque disponivel para essa variacao: ${Number(variant.estoque)}.`
    );
  }

  await updateCartItemQuantity({
    userId,
    cartItemId,
    quantity: parsedQuantity,
  });

  return getCart(userId);
}

async function removeItemFromCart({ userId, cartItemId }) {
  const deleted = await removeCartItem({
    userId,
    cartItemId,
  });

  if (!deleted) {
    throw createHttpError(404, "Item do carrinho nao encontrado.");
  }

  return getCart(userId);
}

async function calculateShippingForCart({ userId, zipCode }) {
  const cart = await getCart(userId);

  if (!cart.items.length) {
    throw createHttpError(400, "Adicione itens ao carrinho antes de calcular o frete.");
  }

  const shippingQuote = getShippingQuote(zipCode);

  return {
    shippingQuote,
    cart: {
      items: cart.items,
      summary: buildSummary(cart.items, shippingQuote),
    },
  };
}

module.exports = {
  addItemToCart,
  buildSummary,
  calculateShippingForCart,
  getCart,
  mapCartItem,
  removeItemFromCart,
  updateItemInCart,
};
