import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

export function ProductCard({
  product,
  onAddToCart,
  isBusy = false,
  accent = "Adicionar ao carrinho",
}) {
  const hasVariations =
    Array.isArray(product.availableSizes) &&
    product.availableSizes.length > 0 &&
    Array.isArray(product.availableColors) &&
    product.availableColors.length > 0;

  return (
    <article className="product-card">
      <Link className="product-card-media" to={`/produto/${product.id}`}>
        <img alt={product.name} loading="lazy" src={product.imageUrl} />
      </Link>
      <div className="product-card-body">
        <span className="category-tag">{product.category}</span>
        <Link className="product-card-title" to={`/produto/${product.id}`}>
          {product.name}
        </Link>
        <p className={`stock-indicator ${product.stock > 0 ? "stock-indicator-available" : "stock-indicator-empty"}`}>
          {product.stock > 0 ? `${product.stock} em estoque` : "Sem estoque"}
        </p>
        <div className="product-card-actions">
          <strong className="product-card-price">{formatCurrency(product.price)}</strong>
          {hasVariations ? (
            <Link className="primary-button compact-button" to={`/produto/${product.id}`}>
              {product.stock <= 0 ? "Ver produto" : "Escolher opcoes"}
            </Link>
          ) : (
            <button
              className="primary-button compact-button"
              disabled={isBusy || product.stock <= 0}
              type="button"
              onClick={() => onAddToCart?.(product)}
            >
              {product.stock <= 0 ? "Indisponivel" : isBusy ? "Adicionando..." : accent}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
