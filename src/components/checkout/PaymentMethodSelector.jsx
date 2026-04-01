const paymentMethods = [
  {
    id: "pix",
    title: "PIX",
    description: "Confirme em segundos com QR Code e chave copia e cola.",
  },
  {
    id: "boleto",
    title: "Boleto",
    description: "Gere uma linha digitavel simulada para o seu portfolio.",
  },
  {
    id: "credit",
    title: "Cartao de credito",
    description: "Fluxo visual completo com formulario elegante e rapido.",
  },
  {
    id: "debit",
    title: "Cartao de debito",
    description: "Simulacao enxuta para concluir o pagamento na hora.",
  },
];

export function PaymentMethodSelector({ selectedMethod, onSelect }) {
  return (
    <div className="payment-method-grid">
      {paymentMethods.map((method) => (
        <button
          className={`payment-method-card ${
            selectedMethod === method.id ? "payment-method-card-active" : ""
          }`}
          key={method.id}
          type="button"
          onClick={() => onSelect(method.id)}
        >
          <span className="summary-label">{method.title}</span>
          <strong>{method.title}</strong>
          <p>{method.description}</p>
        </button>
      ))}
    </div>
  );
}
