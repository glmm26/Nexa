import { formatCurrency, formatDateTime } from "../../utils/formatters";
import {
  formatMovementDelta,
  getInventoryLabel,
  getInventoryTone,
  getProductStatus,
} from "./adminProductUtils";

function ProductActionIcon({ type }) {
  const icons = {
    details: "M4 6h16M4 12h16M4 18h16",
    edit: "M4 20h4l10.5-10.5-4-4L4 16v4z",
    stock: "M12 4v16M4 12h16",
    delete: "M6 7h12M9 7V5h6v2m-7 3v7m4-7v7",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={icons[type]}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function AdminProductCard({
  isExpanded,
  isBusy,
  onDelete,
  onEdit,
  onQuickStock,
  onToggleDetails,
  product,
}) {
  const inventoryTone = getInventoryTone(product);
  const status = getProductStatus(product);

  return (
    <article className="admin-catalog-card">
      <div className="admin-catalog-media">
        <img alt={product.name} src={product.imageUrl} />
      </div>

      <div className="admin-catalog-body">
        <div className="admin-catalog-head">
          <div>
            <div className="admin-catalog-badges">
              <span className="variation-pill">{product.category}</span>
              <span className={`admin-status-pill admin-status-pill-${status}`}>
                {status === "ativo" ? "Ativo" : "Inativo"}
              </span>
              <span className={`admin-stock-pill admin-stock-pill-${inventoryTone}`}>
                {getInventoryLabel(product)}
              </span>
            </div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>

          <div className="admin-catalog-price">
            <strong>{formatCurrency(product.price)}</strong>
            <small>{product.availableSizes.length} tamanhos</small>
          </div>
        </div>

        <div className="admin-catalog-meta-grid">
          <div>
            <span className="summary-label">Cores</span>
            <div className="variation-pill-list">
              {product.availableColors.map((color) => (
                <span className="variation-pill" key={`${product.id}-${color}`}>
                  {color}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="summary-label">Tamanhos</span>
            <div className="variation-pill-list">
              {product.availableSizes.map((size) => (
                <span className="variation-pill" key={`${product.id}-${size}`}>
                  {size}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-catalog-actions">
          <button className="secondary-button compact-button" type="button" onClick={onToggleDetails}>
            <ProductActionIcon type="details" />
            {isExpanded ? "Ocultar" : "Detalhes"}
          </button>
          <button className="secondary-button compact-button" type="button" onClick={onEdit}>
            <ProductActionIcon type="edit" />
            Editar
          </button>
          <button className="secondary-button compact-button" type="button" onClick={onQuickStock}>
            <ProductActionIcon type="stock" />
            Estoque
          </button>
          <button
            className="secondary-button compact-button danger-button"
            disabled={isBusy}
            type="button"
            onClick={onDelete}
          >
            <ProductActionIcon type="delete" />
            {isBusy ? "Excluindo..." : "Excluir"}
          </button>
        </div>

        {isExpanded ? (
          <div className="admin-catalog-details">
            <div className="admin-catalog-detail-grid">
              <div className="admin-detail-panel">
                <span className="summary-label">Variacoes atuais</span>
                <div className="admin-variant-preview-list">
                  {(product.variants || []).map((variant) => (
                    <span className="variation-pill" key={variant.id}>
                      {variant.size}/{variant.color}: {variant.stock}
                    </span>
                  ))}
                </div>
              </div>

              <div className="admin-detail-panel">
                <span className="summary-label">Historico recente</span>
                {product.recentMovements?.length ? (
                  <div className="admin-movement-list">
                    {product.recentMovements.map((movement) => (
                      <div className="admin-movement-item" key={movement.id}>
                        <div>
                          <strong>
                            {movement.size}/{movement.color}
                          </strong>
                          <p>{movement.reason || "Ajuste sem observacao"}</p>
                        </div>
                        <div className="admin-movement-meta">
                          <span
                            className={`admin-movement-delta ${
                              movement.delta > 0 ? "admin-movement-delta-positive" : "admin-movement-delta-negative"
                            }`}
                          >
                            {formatMovementDelta(movement.delta)}
                          </span>
                          <small>
                            {movement.previousStock} para {movement.currentStock}
                          </small>
                          <small>{formatDateTime(movement.createdAt)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="selection-helper">
                    Nenhuma movimentacao registrada ainda para este produto.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
