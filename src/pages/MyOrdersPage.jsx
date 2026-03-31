import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { fetchMyOrders, fetchOrderDetails } from "../services/orderService";
import { formatCurrency, formatDateTime, formatOrderStatus } from "../utils/formatters";

function getStatusTone(status) {
  if (status === "entregue") {
    return "status-chip-success";
  }

  if (status === "cancelado") {
    return "status-chip-danger";
  }

  return "status-chip-warning";
}

function toLabel(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const { showToast } = useToast();

  useDocumentTitle("Meus pedidos | NEXA");

  useEffect(() => {
    fetchMyOrders()
      .then((response) => {
        setOrders(response.orders || []);
      })
      .catch((error) => {
        showToast(error.message, "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleToggleDetails(orderId) {
    const isOpen = expandedOrderId === orderId;

    if (isOpen) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    if (detailsById[orderId]) {
      return;
    }

    setLoadingOrderId(orderId);

    try {
      const response = await fetchOrderDetails(orderId);
      setDetailsById((current) => ({
        ...current,
        [orderId]: response.order,
      }));
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoadingOrderId(null);
    }
  }

  if (isLoading) {
    return <LoadingBlock label="Carregando seus pedidos..." />;
  }

  if (!orders.length) {
    return (
      <div className="shell-content section-space">
        <SectionHeader
          eyebrow="Meus pedidos"
          title="Voce ainda nao fez nenhum pedido."
          description="Quando concluir uma compra, o historico aparece aqui com status e detalhes."
        />
        <div className="empty-panel">
          <h2>Sua vitrine de pedidos comeca na loja.</h2>
          <p>Escolha seus produtos favoritos e acompanhe tudo por aqui.</p>
          <Link className="primary-button" to="/">
            Ir para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-content section-space">
      <SectionHeader
        eyebrow="Meus pedidos"
        title="Acompanhe cada compra em um so lugar."
        description="Veja o total, o status atual e abra os detalhes de cada pedido quando precisar."
      />

      <div className="orders-stack">
        {orders.map((order) => {
          const orderDetails = detailsById[order.id];
          const isExpanded = expandedOrderId === order.id;

          return (
            <section className="order-card" key={order.id}>
              <div className="order-card-head">
                <div className="order-card-title">
                  <span className="summary-label">Pedido</span>
                  <h2>#{order.id}</h2>
                  <p>{formatDateTime(order.createdAt)}</p>
                </div>

                <div className="order-card-meta">
                  <span className={`status-chip ${getStatusTone(order.status)}`}>
                    {formatOrderStatus(order.status)}
                  </span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
              </div>

              <div className="order-summary-grid">
                <div>
                  <span className="summary-label">Subtotal</span>
                  <strong>{formatCurrency(order.subtotal)}</strong>
                </div>
                <div>
                  <span className="summary-label">Frete</span>
                  <strong>{order.shipping === 0 ? "Gratis" : formatCurrency(order.shipping)}</strong>
                </div>
                <div>
                  <span className="summary-label">Status</span>
                  <strong>{formatOrderStatus(order.status)}</strong>
                </div>
                <div>
                  <span className="summary-label">Prazo</span>
                  <strong>{order.shippingEstimate || "Nao informado"}</strong>
                </div>
              </div>

              <div className="order-card-actions">
                <button
                  className="secondary-button compact-button"
                  type="button"
                  onClick={() => handleToggleDetails(order.id)}
                >
                  {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
              </div>

              {isExpanded ? (
                loadingOrderId === order.id ? (
                  <div className="order-details-loading">
                    <span className="loading-ring" />
                    <p>Buscando itens do pedido...</p>
                  </div>
                ) : orderDetails ? (
                  <div className="order-details">
                    <StatusMessage tone="info" title="Entrega">
                      {orderDetails.customer.address}, {orderDetails.customer.city} - CEP{" "}
                      {orderDetails.customer.zipCode}
                    </StatusMessage>

                    <div className="order-items-list">
                      {orderDetails.items.map((item) => (
                        <article className="order-item-row" key={item.id}>
                          <div>
                            <h3>{item.productName}</h3>
                            <p>
                              {item.quantity}x {formatCurrency(item.unitPrice)}
                            </p>
                            <p className="order-item-meta-line">
                              Tamanho {toLabel(item.selectedSize)} - Cor {toLabel(item.selectedColor)}
                            </p>
                          </div>
                          <strong>{formatCurrency(item.lineTotal)}</strong>
                        </article>
                      ))}
                    </div>

                    {orderDetails.statusHistory?.length ? (
                      <div className="status-history-block">
                        <span className="summary-label">Historico de status</span>
                        <div className="status-history-list">
                          {orderDetails.statusHistory.map((entry) => (
                            <div className="status-history-item" key={entry.id}>
                              <strong>{formatOrderStatus(entry.status)}</strong>
                              <span>{formatDateTime(entry.date)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
