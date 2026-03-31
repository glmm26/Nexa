import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell-content footer-grid">
        <div className="footer-block">
          <span className="section-kicker">NEXA</span>
          <h3>Moda essencial com imagens reais, compra rapida e curadoria premium.</h3>
        </div>
        <div className="footer-block">
          <span className="footer-label">Loja</span>
          <Link to="/">Novidades</Link>
          <Link to="/carrinho">Carrinho</Link>
          <Link to="/perfil">Minha conta</Link>
        </div>
        <div className="footer-block">
          <span className="footer-label">Suporte</span>
          <a href="mailto:contato@nexa-store.com">contato@nexa-store.com</a>
          <span>Frete gratis acima de R$ 350,00.</span>
          <span>Troca simplificada em ate 7 dias.</span>
        </div>
      </div>
    </footer>
  );
}
