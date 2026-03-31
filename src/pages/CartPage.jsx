import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { CartItemCard } from "../components/cart/CartItemCard";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatCurrency } from "../utils/formatters";

function normalizeZipCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

function maskZipCode(value) {
  const digits = normalizeZipCode(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function CartPage() {
  const { user, isHydrating } = useAuth();
  const {
    cart,
    changeItem,
    removeItem,
    completeCheckout,
    isCartLoading,
    quoteShipping,
    clearShippingQuote,
    shippingQuote,
  } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [checkoutData, setCheckoutData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    notes: "",
  });
  const [busyItemId, setBusyItemId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  useDocumentTitle("Carrinho | NEXA");

  useEffect(() => {
    if (!user) {
      return;
    }

    setCheckoutData((current) => ({
      ...current,
      name: user.name,
      email: user.email,
    }));
  }, [user]);

  const normalizedCurrentZip = normalizeZipCode(checkoutData.zipCode);
  const hasValidShippingQuote =
    Boolean(shippingQuote) && shippingQuote.zipCode === normalizedCurrentZip;

  async function handleChangeQuantity(itemId, quantity) {
    setBusyItemId(itemId);

    try {
      await changeItem(itemId, { quantity });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(itemId) {
    setBusyItemId(itemId);

    try {
      await removeItem(itemId);
      showToast("Item removido do carrinho.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleCalculateShipping() {
    if (normalizedCurrentZip.length !== 8) {
      showToast("Informe um CEP valido com 8 digitos para calcular o frete.", "info");
      return;
    }

    setIsCalculatingShipping(true);

    try {
      const response = await quoteShipping(normalizedCurrentZip);
      showToast(
        `Frete calculado: ${formatCurrency(response.shippingQuote.amount)} (${response.shippingQuote.estimatedDays}).`,
        "success"
      );
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsCalculatingShipping(false);
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();

    if (!hasValidShippingQuote) {
      showToast("Calcule o frete antes de finalizar o pedido.", "info");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await completeCheckout(checkoutData);
      showToast(response.message, "success");
      setCheckoutData((current) => ({
        ...current,
        address: "",
        city: "",
        zipCode: "",
        notes: "",
      }));
      navigate("/meus-pedidos");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydrating) {
    return <LoadingBlock label="Preparando seu carrinho..." />;
  }

  if (!user) {
    return (
      <div className="shell-content section-space">
        <SectionHeader
          eyebrow="Carrinho"
          title="Entre para ver seu carrinho."
          description="Acesse a conta para salvar itens e finalizar o pedido."
        />
        <div className="empty-panel">
          <h2>Faca login para continuar.</h2>
          <p>Seu carrinho fica salvo assim que a conta estiver ativa.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/login">
              Entrar
            </Link>
            <Link className="secondary-button" to="/cadastro">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isCartLoading) {
    return <LoadingBlock label="Atualizando seu carrinho..." />;
  }

  if (!cart.items.length) {
    return (
      <div className="shell-content section-space">
        <SectionHeader
          eyebrow="Carrinho"
          title="Seu carrinho esta vazio."
          description="Explore a loja e adicione produtos para finalizar o pedido."
        />
        <div className="empty-panel">
          <h2>Escolha o primeiro produto.</h2>
          <p>Volte para a home e descubra as novidades da colecao.</p>
          <Link className="primary-button" to="/">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-content section-space">
      <SectionHeader
        eyebrow="Carrinho"
        title="Revise os itens e finalize."
        description="Ajuste quantidades, confira o total e conclua a compra em poucos passos."
      />

      <div className="cart-layout">
        <div className="cart-column">
          <StatusMessage tone={hasValidShippingQuote ? "success" : "info"} title="Frete">
            {hasValidShippingQuote
              ? `Entrega simulada em ${shippingQuote.estimatedDays} para a faixa ${shippingQuote.zone}.`
              : "Informe o CEP e clique em calcular frete para atualizar o total do pedido."}
          </StatusMessage>

          {cart.items.map((item) => (
            <CartItemCard
              key={item.id}
              isBusy={busyItemId === item.id}
              item={item}
              onChangeQuantity={handleChangeQuantity}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <aside className="checkout-panel">
          <h2>Resumo do pedido</h2>
          <div className="summary-line">
            <span>Itens</span>
            <strong>{cart.summary.itemCount}</strong>
          </div>
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatCurrency(cart.summary.subtotal)}</strong>
          </div>
          <div className="summary-line">
            <span>Frete</span>
            <strong>
              {hasValidShippingQuote
                ? formatCurrency(cart.summary.shipping)
                : "Calcule o frete"}
            </strong>
          </div>
          <div className="summary-line summary-line-total">
            <span>Total</span>
            <strong>{formatCurrency(cart.summary.total)}</strong>
          </div>

          <form className="form-panel" onSubmit={handleCheckout}>
            <label className="field-shell">
              <span>Nome</span>
              <input
                required
                type="text"
                value={checkoutData.name}
                onChange={(event) =>
                  setCheckoutData((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className="field-shell">
              <span>Email</span>
              <input
                required
                type="email"
                value={checkoutData.email}
                onChange={(event) =>
                  setCheckoutData((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>

            <label className="field-shell">
              <span>Endereco</span>
              <input
                required
                type="text"
                value={checkoutData.address}
                onChange={(event) =>
                  setCheckoutData((current) => ({ ...current, address: event.target.value }))
                }
              />
            </label>

            <div className="field-grid">
              <label className="field-shell">
                <span>Cidade</span>
                <input
                  required
                  type="text"
                  value={checkoutData.city}
                  onChange={(event) =>
                    setCheckoutData((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>

              <label className="field-shell">
                <span>CEP</span>
                <input
                  required
                  type="text"
                  value={checkoutData.zipCode}
                  onChange={(event) =>
                    setCheckoutData((current) => {
                      const nextZipCode = maskZipCode(event.target.value);

                      if (shippingQuote && normalizeZipCode(nextZipCode) !== shippingQuote.zipCode) {
                        clearShippingQuote();
                      }

                      return { ...current, zipCode: nextZipCode };
                    })
                  }
                />
              </label>
            </div>

            <div className="shipping-quote-panel">
              <div className="shipping-quote-head">
                <div>
                  <span className="summary-label">Frete</span>
                  <h3>Calcule a entrega antes do checkout</h3>
                </div>
                <button
                  className="secondary-button compact-button"
                  disabled={isCalculatingShipping}
                  type="button"
                  onClick={handleCalculateShipping}
                >
                  {isCalculatingShipping ? "Calculando..." : "Calcular frete"}
                </button>
              </div>

              {hasValidShippingQuote ? (
                <div className="shipping-quote-result">
                  <div>
                    <span className="summary-label">Valor</span>
                    <strong>{formatCurrency(shippingQuote.amount)}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Prazo</span>
                    <strong>{shippingQuote.estimatedDays}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Regiao</span>
                    <strong>{shippingQuote.zone}</strong>
                  </div>
                </div>
              ) : (
                <p className="shipping-quote-placeholder">
                  Informe um CEP valido e calcule o frete para atualizar o total final.
                </p>
              )}
            </div>

            <label className="field-shell">
              <span>Observacoes do pedido</span>
              <textarea
                rows="4"
                value={checkoutData.notes}
                onChange={(event) =>
                  setCheckoutData((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>

            <button
              className="primary-button block-button"
              disabled={isSubmitting || !hasValidShippingQuote}
              type="submit"
            >
              {isSubmitting ? "Finalizando..." : "Finalizar pedido"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
