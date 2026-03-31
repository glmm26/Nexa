const {
  createOrder,
  findUserById,
  getOrderById,
  getOrderByIdForUser,
  listAllOrders,
  listOrdersByUserId,
  updateOrderStatus,
} = require("../database/database");
const { buildSummary, getCart } = require("./cartService");
const { createHttpError } = require("../utils/httpError");
const { getShippingQuote } = require("./shippingService");

const ORDER_STATUSES = ["pendente", "confirmado", "enviado", "entregue", "cancelado"];

function serializeOrderItem(item) {
  const quantity = Number(item.quantidade);
  const unitPrice = Number(item.preco_unitario);

  return {
    id: item.id,
    productId: item.produto_id,
    productName: item.nome_produto,
    imageUrl: item.imagem_url,
    quantity,
    unitPrice,
    selectedSize: item.tamanho_selecionado || "",
    selectedColor: item.cor_selecionada || "",
    lineTotal: Math.round(quantity * unitPrice * 100) / 100,
  };
}

function serializeOrder(order) {
  return {
    id: order.id,
    userId: order.usuario_id,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shipping: Number(order.frete),
    shippingEstimate: order.prazo_entrega || "",
    status: order.status,
    createdAt: order.criado_em,
    customer: {
      name: order.contato_nome,
      email: order.contato_email,
      address: order.endereco,
      city: order.cidade,
      zipCode: order.cep,
      notes: order.observacoes || "",
    },
    user: {
      id: order.usuario_id,
      name: order.usuario_nome,
      email: order.usuario_email,
      role: order.usuario_role,
    },
    items: Array.isArray(order.items) ? order.items.map(serializeOrderItem) : [],
    statusHistory: Array.isArray(order.status_history)
      ? order.status_history.map((entry) => ({
          id: entry.id,
          status: entry.status,
          date: entry.data,
        }))
      : [],
  };
}

function validateCheckoutPayload(payload) {
  const fields = {
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    address: String(payload.address || "").trim(),
    city: String(payload.city || "").trim(),
    zipCode: String(payload.zipCode || "").trim(),
    notes: String(payload.notes || "").trim(),
  };

  if (!fields.name || !fields.email || !fields.address || !fields.city || !fields.zipCode) {
    throw createHttpError(400, "Preencha os dados de entrega para finalizar o pedido.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    throw createHttpError(400, "Informe um email valido para o pedido.");
  }

  return fields;
}

function validateStatus(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (!ORDER_STATUSES.includes(normalizedStatus)) {
    throw createHttpError(400, "Status de pedido invalido.", {
      details: {
        allowedStatuses: ORDER_STATUSES,
      },
    });
  }

  return normalizedStatus;
}

async function createOrderFromCart({ userId, checkoutData }) {
  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Usuario nao encontrado.");
  }

  const cart = await getCart(userId);

  if (cart.items.length === 0) {
    throw createHttpError(400, "Seu carrinho esta vazio.");
  }

  const unavailableItem = cart.items.find(
    (item) => item.product.stock <= 0 || item.quantity > item.product.stock
  );

  if (unavailableItem) {
    throw createHttpError(
      400,
      `Estoque insuficiente para ${unavailableItem.product.name}. Disponivel: ${unavailableItem.product.stock}.`
    );
  }

  const customer = validateCheckoutPayload({
    name: checkoutData.name || user.nome,
    email: checkoutData.email || user.email,
    address: checkoutData.address,
    city: checkoutData.city,
    zipCode: checkoutData.zipCode,
    notes: checkoutData.notes,
  });

  const shippingQuote = getShippingQuote(customer.zipCode);
  const summary = buildSummary(cart.items, shippingQuote);

  const order = await createOrder({
    userId,
    subtotal: summary.subtotal,
    frete: shippingQuote.amount,
    total: summary.total,
    status: "pendente",
    contatoNome: customer.name,
    contatoEmail: customer.email,
    endereco: customer.address,
    cidade: customer.city,
    cep: customer.zipCode,
    observacoes: customer.notes,
    prazoEntrega: shippingQuote.estimatedDays,
    items: cart.items,
  });

  return {
    message: `Pedido #${order.id} criado com sucesso.`,
    order: serializeOrder(order),
    cart: {
      items: [],
      summary: buildSummary([]),
    },
  };
}

async function getOrdersForUser(userId) {
  const orders = await listOrdersByUserId(userId);

  return {
    orders: orders.map((order) => ({
      id: order.id,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shipping: Number(order.frete),
      shippingEstimate: order.prazo_entrega || "",
      status: order.status,
      createdAt: order.criado_em,
    })),
  };
}

async function getOrderDetailsForUser({ userId, orderId }) {
  const order = await getOrderByIdForUser({ userId, orderId });

  if (!order) {
    throw createHttpError(404, "Pedido nao encontrado.");
  }

  return {
    order: serializeOrder(order),
  };
}

async function getOrdersForAdmin() {
  const orders = await listAllOrders();

  return {
    orders: orders.map(serializeOrder),
    allowedStatuses: ORDER_STATUSES,
  };
}

async function updateOrderStatusForAdmin({ orderId, status }) {
  const nextStatus = validateStatus(status);
  const currentOrder = await getOrderById(orderId);

  if (!currentOrder) {
    throw createHttpError(404, "Pedido nao encontrado.");
  }

  const updatedOrder = await updateOrderStatus({
    orderId,
    status: nextStatus,
  });

  return {
    message: `Status do pedido #${orderId} atualizado para ${nextStatus}.`,
    order: serializeOrder(updatedOrder),
  };
}

module.exports = {
  ORDER_STATUSES,
  createOrderFromCart,
  getOrderDetailsForUser,
  getOrdersForAdmin,
  getOrdersForUser,
  updateOrderStatusForAdmin,
};
