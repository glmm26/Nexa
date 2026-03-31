import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../context/ToastContext";

function linkClassName({ isActive }) {
  return `nav-link ${isActive ? "nav-link-active" : ""}`;
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      showToast("Voce saiu da sua conta.", "success");
      navigate("/");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  return (
    <header className="site-header">
      <div className="shell-content">
        <div className="header-bar">
          <NavLink aria-label="NEXA" className="brand" to="/">
            <span className="brand-logo-frame">
              <img alt="NEXA" className="brand-logo" src="/assets/nexa-logo-cropped.png" />
            </span>
          </NavLink>

          <nav className="site-nav" aria-label="Principal">
            <NavLink className={linkClassName} to="/">
              Loja
            </NavLink>
            <NavLink className={linkClassName} to="/carrinho">
              Carrinho
              <span className="cart-badge">{cart.summary.itemCount}</span>
            </NavLink>
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <NavLink className="secondary-button compact-button" to="/meus-pedidos">
                  Pedidos
                </NavLink>
                {user.adminAuthorized ? (
                  <NavLink className="secondary-button compact-button" to="/admin/estoque">
                    Admin
                  </NavLink>
                ) : null}
                <NavLink className="profile-link" to="/perfil">
                  <div className="profile-pill">
                    <span>{user.name}</span>
                    <small>
                      {user.adminAuthorized
                        ? "Administrador"
                        : user.verified
                          ? "Conta verificada"
                          : "Verificacao pendente"}
                    </small>
                  </div>
                </NavLink>
                <button
                  className="secondary-button compact-button"
                  type="button"
                  onClick={handleLogout}
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <NavLink className="secondary-button compact-button" to="/login">
                  Entrar
                </NavLink>
                <NavLink className="primary-button compact-button" to="/cadastro">
                  Criar conta
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
