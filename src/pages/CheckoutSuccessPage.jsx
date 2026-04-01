import { Link, Navigate } from "react-router-dom";
import { OrderConfirmationSummary } from "../components/checkout/OrderConfirmationSummary";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function CheckoutSuccessPage() {
  const { lastCompletedOrder, clearLastCompletedOrder } = useCart();

  useDocumentTitle("Pedido confirmado | NEXA");

  if (!lastCompletedOrder?.order) {
    return <Navigate replace to="/meus-pedidos" />;
  }

  return (
    <div className="shell-content section-space checkout-page-shell">
      <SectionHeader
        eyebrow="Confirmacao"
        title="Pagamento concluido e pedido registrado."
        description="Tudo pronto: o fluxo de compra do portfolio foi finalizado com sucesso."
      />

      <OrderConfirmationSummary
        completedOrder={lastCompletedOrder}
        onClear={clearLastCompletedOrder}
      />

      <div className="checkout-helper-actions">
        <Link className="secondary-button compact-button" to="/carrinho">
          Voltar ao carrinho
        </Link>
        <span>Seu carrinho foi limpo automaticamente apos a confirmacao do pedido.</span>
      </div>
    </div>
  );
}
