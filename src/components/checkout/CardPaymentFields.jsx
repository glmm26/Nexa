export function CardPaymentFields({ cardData, cardTypeLabel, onChange }) {
  return (
    <div className="payment-card-form">
      <div className="checkout-panel-highlight">
        <span className="summary-label">{cardTypeLabel}</span>
        <h3>Dados do cartao</h3>
        <p>Preencha os campos para simular a experiencia completa do checkout.</p>
      </div>

      <label className="field-shell">
        <span>Nome no cartao</span>
        <input
          placeholder="Nome exibido no cartao"
          type="text"
          value={cardData.cardholderName}
          onChange={(event) => onChange("cardholderName", event.target.value)}
        />
      </label>

      <label className="field-shell">
        <span>Numero do cartao</span>
        <input
          placeholder="0000 0000 0000 0000"
          type="text"
          value={cardData.cardNumber}
          onChange={(event) => onChange("cardNumber", event.target.value)}
        />
      </label>

      <div className="field-grid">
        <label className="field-shell">
          <span>Validade</span>
          <input
            placeholder="MM/AA"
            type="text"
            value={cardData.expirationDate}
            onChange={(event) => onChange("expirationDate", event.target.value)}
          />
        </label>

        <label className="field-shell">
          <span>CVV</span>
          <input
            placeholder="123"
            type="text"
            value={cardData.cvv}
            onChange={(event) => onChange("cvv", event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
