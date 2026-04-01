import { formatCurrency } from "../../utils/formatters";

export function CheckoutOrderSummary({
  cart,
  checkoutData,
  shippingQuote,
  title = "Resumo do pedido",
}) {
  return (
    <aside className="checkout-summary-card">
      <div className="checkout-summary-head">
        <div>
          <span className="summary-label">Checkout</span>
          <h2>{title}</h2>
        </div>
        <strong>{formatCurrency(cart.summary.total)}</strong>
      </div>

      <div className="checkout-summary-stack">
        {cart.items.map((item) => (
          <article className="checkout-summary-item" key={item.id}>
            <img alt={item.product.name} src={item.product.imageUrl} />
            <div>
              <h3>{item.product.name}</h3>
              <p>
                {item.quantity}x {formatCurrency(item.product.price)}
              </p>
              <small>
                {item.selectedSize} · {item.selectedColor}
              </small>
            </div>
            <strong>{formatCurrency(item.lineTotal)}</strong>
          </article>
        ))}
      </div>

      <div className="checkout-summary-total">
        <div className="summary-line">
          <span>Subtotal</span>
          <strong>{formatCurrency(cart.summary.subtotal)}</strong>
        </div>
        <div className="summary-line">
          <span>Frete</span>
          <strong>{shippingQuote ? formatCurrency(shippingQuote.amount) : "A calcular"}</strong>
        </div>
        <div className="summary-line summary-line-total">
          <span>Total</span>
          <strong>{formatCurrency(cart.summary.total)}</strong>
        </div>
      </div>

      <div className="checkout-customer-card">
        <span className="summary-label">Entrega</span>
        <strong>{checkoutData.name}</strong>
        <p>{checkoutData.address}</p>
        <p>
          {checkoutData.city} · CEP {checkoutData.zipCode}
        </p>
        <p>{checkoutData.email}</p>
        {checkoutData.notes ? <small>Obs.: {checkoutData.notes}</small> : null}
      </div>
    </aside>
  );
}
