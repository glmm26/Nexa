import { useEffect, useState } from "react";
import { AdminSectionNav } from "../components/admin/AdminSectionNav";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { fetchAdminOrders, updateAdminOrderStatus } from "../services/orderService";
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

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const [draftStatusById, setDraftStatusById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const { showToast } = useToast();

  useDocumentTitle("Admin | Pedidos");

  useEffect(() => {
    fetchAdminOrders()
      .then((response) => {
        const nextOrders = response.orders || [];
        setOrders(nextOrders);
        setAllowedStatuses(response.allowedStatuses || []);
        setDraftStatusById(Object.fromEntries(nextOrders.map((order) => [order.id, order.status])));
      })
      .catch((error) => {
        showToast(error.message, "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleSaveStatus(order) {
    const nextStatus = draftStatusById[order.id];

    if (!nextStatus || nextStatus === order.status) {
      return;
    }

    setBusyOrderId(order.id);

    try {
      const response = await updateAdminOrderStatus(order.id, {
        status: nextStatus,
      });

      setOrders((current) => current.map((item) => (item.id === order.id ? response.order : item)));
      setDraftStatusById((current) => ({
        ...current,
        [order.id]: response.order.status,
      }));
      showToast(response.message, "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyOrderId(null);
    }
  }

  if (isLoading) {
    return <LoadingBlock label="Carregando pedidos..." />;
  }

  if (!orders.length) {
    return (
      <div className="shell-content section-space admin-page-stack">
        <SectionHeader
          eyebrow="Admin"
          title="Pedidos"
          description="Nenhum pedido foi registrado ainda."
        />
        <AdminSectionNav />
        <div className="empty-panel">
          <h2>O painel de pedidos ainda esta vazio.</h2>
          <p>Assim que um cliente concluir a compra, os pedidos aparecerao aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-content section-space admin-page-stack">
      <SectionHeader
        eyebrow="Admin"
        title="Pedidos"
        description="Acompanhe clientes, itens comprados e corrija qualquer status sem travar o fluxo operacional."
      />

      <AdminSectionNav />

      <StatusMessage tone="info" title="Status editavel">
        Use o dropdown para trocar livremente entre pendente, confirmado, enviado, entregue ou cancelado.
      </StatusMessage>

      <div className="orders-stack admin-orders-stack">
        {orders.map((order) => {
          const draftStatus = draftStatusById[order.id] || order.status;
          const hasChanges = draftStatus !== order.status;

          return (
            <section className="order-card" key={order.id}>
              <div className="order-card-head">
                <div className="order-card-title">
                  <span className="summary-label">Pedido #{order.id}</span>
                  <h2>{order.user.name}</h2>
                  <p>
                    {order.user.email} - {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="order-card-meta">
                  <span className={`status-chip ${getStatusTone(order.status)}`}>
                    {formatOrderStatus(order.status)}
                  </span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
              </div>

              <div className="order-summary-grid order-summary-grid-admin">
                <div>
                  <span className="summary-label">Contato</span>
                  <strong>{order.customer.name}</strong>
                </div>
                <div>
                  <span className="summary-label">Entrega</span>
                  <strong>
                    {order.customer.city} - {order.customer.zipCode}
                  </strong>
                </div>
                <div>
                  <span className="summary-label">Itens</span>
                  <strong>{order.items.length} produtos</strong>
                </div>
                <div>
                  <span className="summary-label">Prazo</span>
                  <strong>{order.shippingEstimate || "Nao informado"}</strong>
                </div>
              </div>

              <div className="order-items-list">
                {order.items.map((item) => (
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

              {order.statusHistory?.length ? (
                <div className="status-history-block">
                  <span className="summary-label">Historico de status</span>
                  <div className="status-history-list">
                    {order.statusHistory.map((entry) => (
                      <div className="status-history-item" key={entry.id}>
                        <strong>{formatOrderStatus(entry.status)}</strong>
                        <span>{formatDateTime(entry.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="order-card-actions">
                <label className="field-shell admin-status-shell">
                  <span>Status atual</span>
                  <select
                    value={draftStatus}
                    onChange={(event) =>
                      setDraftStatusById((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                  >
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatOrderStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="primary-button compact-button"
                  disabled={!hasChanges || busyOrderId === order.id}
                  type="button"
                  onClick={() => handleSaveStatus(order)}
                >
                  {busyOrderId === order.id ? "Atualizando..." : "Salvar status"}
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
