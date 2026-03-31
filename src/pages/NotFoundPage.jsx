import { Link } from "react-router-dom";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Pagina nao encontrada | NEXA");

  return (
    <div className="shell-content section-space">
      <SectionHeader
        eyebrow="404"
        title="Essa pagina nao esta disponivel."
        description="Volte para a home e continue navegando pela loja."
      />
      <div className="empty-panel">
        <h2>O link saiu do ar.</h2>
        <p>Retorne para a home e descubra os produtos em destaque.</p>
        <Link className="primary-button" to="/">
          Ir para a home
        </Link>
      </div>
    </div>
  );
}
