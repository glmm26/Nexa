import { NavLink } from "react-router-dom";

function navClassName({ isActive }) {
  return `admin-nav-link ${isActive ? "admin-nav-link-active" : ""}`;
}

export function AdminSectionNav() {
  return (
    <nav className="admin-section-nav" aria-label="Admin">
      <NavLink className={navClassName} to="/admin/estoque">
        Produtos e estoque
      </NavLink>
      <NavLink className={navClassName} to="/admin/pedidos">
        Pedidos
      </NavLink>
    </nav>
  );
}
