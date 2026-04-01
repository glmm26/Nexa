import { Link } from "react-router-dom";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

export function OrderConfirmationSummary({ completedOrder, onClear }) {
  const order = completedOrder?.order;

  if (!order) {
    return null;
  }

  return (
    <section className="checkout-success-card">
      <div className="checkout-success-head">
        <div className="checkout-success-badge">Pagamento confirmado</div>
        <h1>Pedido realizado com sucesso!</h1>
        <p>
          O pedido #{order.id} ja entrou no fluxo da loja. A confirmacao abaixo foi montada para
          demonstrar o checkout completo do portfolio.
        </p>
      </div>

      <div className="checkout-success-grid">
        <div className="checkout-success-panel">
          <span className="summary-label">Pedido</span>
          <strong>#{order.id}</strong>
          <p>{formatDateTime(order.createdAt || completedOrder.createdAt)}</p>
          <p>Status inicial: {order.status}</p>
        </div>

        <div className="checkout-success-panel">
          <span className="summary-label">Pagamento</span>
          <strong>{completedOrder.payment?.label || "Nao informado"}</strong>
          <p>{completedOrder.payment?.description || "Fluxo simulado para portfolio"}</p>
          <p>Total pago: {formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="checkout-success-list">
        {order.items.map((item) => (
          <article className="checkout-summary-item" key={item.id}>
            <div>
              <h3>{item.productName}</h3>
              <p>
                {item.quantity}x {formatCurrency(item.unitPrice)}
              </p>
              <small>
                {item.selectedSize} · {item.selectedColor}
              </small>
            </div>
            <strong>{formatCurrency(item.lineTotal)}</strong>
          </article>
        ))}
      </div>

      <div className="checkout-success-actions">
        <Link className="primary-button" to="/meus-pedidos" onClick={onClear}>
          Ver meus pedidos
        </Link>
        <Link className="secondary-button" to="/" onClick={onClear}>
          Voltar para a home
        </Link>
      </div>
    </section>
  );
}
