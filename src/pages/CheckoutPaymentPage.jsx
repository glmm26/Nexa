import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardPaymentFields } from "../components/checkout/CardPaymentFields";
import { CheckoutOrderSummary } from "../components/checkout/CheckoutOrderSummary";
import { PaymentMethodSelector } from "../components/checkout/PaymentMethodSelector";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const paymentMethodContent = {
  pix: {
    label: "PIX",
    description: "Pagamento instantaneo simulado para demonstrar um fluxo rapido e moderno.",
  },
  boleto: {
    label: "Boleto",
    description: "Linha digitavel ficticia pronta para download e confirmacao manual.",
  },
  credit: {
    label: "Cartao de credito",
    description: "Fluxo simulado para parcelamento ou aprovacao imediata.",
  },
  debit: {
    label: "Cartao de debito",
    description: "Aprovacao imediata simulada para concluir o pedido.",
  },
};

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createPixKey(email) {
  const normalized = String(email || "cliente@nexa.local")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 18);

  return `${normalized || "cliente"}@pix.nexa`;
}

function createBoletoLine(zipCode) {
  const digits = String(zipCode || "00000000").replace(/\D/g, "").padEnd(8, "0");
  return `34191.79001 01043.510047 91020.150008 ${digits.slice(0, 4)} 9 000000${digits.slice(4)}`;
}

export function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    cart,
    checkoutDraft,
    shippingQuote,
    isCartLoading,
    completeCheckout,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    cvv: "",
    expirationDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasHandledInvalidStateRef = useRef(false);

  useDocumentTitle("Pagamento | NEXA");

  useEffect(() => {
    if (isCartLoading) {
      return;
    }

    const hasCheckoutDraft = Boolean(
      checkoutDraft?.name &&
        checkoutDraft?.email &&
        checkoutDraft?.address &&
        checkoutDraft?.city &&
        checkoutDraft?.zipCode
    );

    if (!cart.items.length || !shippingQuote || !hasCheckoutDraft) {
      if (hasHandledInvalidStateRef.current) {
        return;
      }

      hasHandledInvalidStateRef.current = true;
      showToast("Revise o carrinho e o frete antes de ir para o pagamento.", "info");
      navigate("/carrinho", { replace: true });
    }
  }, [cart.items.length, checkoutDraft, isCartLoading, navigate, shippingQuote, showToast]);

  function handleCardFieldChange(field, value) {
    setCardData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmitPayment() {
    if (paymentMethod === "credit" || paymentMethod === "debit") {
      if (
        !cardData.cardholderName ||
        !cardData.cardNumber ||
        !cardData.expirationDate ||
        !cardData.cvv
      ) {
        showToast("Preencha os campos do cartao para continuar a simulacao.", "info");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await wait(900);
      await completeCheckout(checkoutDraft, paymentMethodContent[paymentMethod]);
      showToast("Pedido realizado com sucesso!", "success");
      navigate("/checkout/sucesso", { replace: true });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCartLoading) {
    return <LoadingBlock label="Preparando pagamento..." />;
  }

  if (!cart.items.length || !shippingQuote) {
    return <LoadingBlock label="Redirecionando para o carrinho..." />;
  }

  return (
    <div className="shell-content section-space checkout-page-shell">
      <SectionHeader
        eyebrow="Pagamento"
        title="Escolha como deseja concluir o pedido."
        description="Fluxo simulado para portfolio com PIX, boleto e cartoes em uma experiencia unica."
      />

      <div className="checkout-layout">
        <section className="checkout-payment-panel">
          <PaymentMethodSelector selectedMethod={paymentMethod} onSelect={setPaymentMethod} />

          <div className="checkout-panel-highlight">
            <span className="summary-label">Metodo selecionado</span>
            <h2>{paymentMethodContent[paymentMethod].label}</h2>
            <p>{paymentMethodContent[paymentMethod].description}</p>
          </div>

          {paymentMethod === "pix" ? (
            <div className="payment-detail-card">
              <div className="payment-qr-preview">
                <div className="payment-qr-pattern" />
              </div>
              <div className="payment-copy-block">
                <span className="summary-label">Chave PIX</span>
                <strong>{createPixKey(checkoutDraft.email)}</strong>
                <p>Escaneie o QR Code ficticio ou copie a chave acima para simular o pagamento.</p>
                <button
                  className="primary-button"
                  disabled={isSubmitting}
                  type="button"
                  onClick={handleSubmitPayment}
                >
                  {isSubmitting ? "Confirmando..." : "Confirmar pagamento"}
                </button>
              </div>
            </div>
          ) : null}

          {paymentMethod === "boleto" ? (
            <div className="payment-detail-card payment-detail-card-column">
              <div className="payment-copy-block">
                <span className="summary-label">Linha digitavel</span>
                <strong>{createBoletoLine(checkoutDraft.zipCode)}</strong>
                <p>Boleto ficticio gerado para demonstracao do checkout em portifolio.</p>
              </div>
              <div className="hero-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => showToast("Boleto ficticio pronto para download.", "success")}
                >
                  Baixar boleto
                </button>
                <button
                  className="primary-button"
                  disabled={isSubmitting}
                  type="button"
                  onClick={handleSubmitPayment}
                >
                  {isSubmitting ? "Confirmando..." : "Confirmar pagamento"}
                </button>
              </div>
            </div>
          ) : null}

          {paymentMethod === "credit" || paymentMethod === "debit" ? (
            <div className="payment-detail-card payment-detail-card-column">
              <CardPaymentFields
                cardData={cardData}
                cardTypeLabel={paymentMethodContent[paymentMethod].label}
                onChange={handleCardFieldChange}
              />

              <button
                className="primary-button"
                disabled={isSubmitting}
                type="button"
                onClick={handleSubmitPayment}
              >
                {isSubmitting ? "Processando..." : "Finalizar pagamento"}
              </button>
            </div>
          ) : null}

          <div className="checkout-helper-actions">
            <Link className="secondary-button compact-button" to="/carrinho">
              Voltar ao carrinho
            </Link>
            <span>O pedido so e criado depois da confirmacao do pagamento simulado.</span>
          </div>
        </section>

        <CheckoutOrderSummary
          cart={cart}
          checkoutData={checkoutDraft}
          shippingQuote={shippingQuote}
          title="Resumo antes do pagamento"
        />
      </div>
    </div>
  );
}
