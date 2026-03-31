import { formatCurrency } from "../../utils/formatters";

export function CartItemCard({ item, onChangeQuantity, onRemove, isBusy = false }) {
  const canIncrease = item.quantity < item.product.stock;

  return (
    <article className="cart-item-card">
      <div className="cart-item-media">
        <img alt={item.product.name} loading="lazy" src={item.product.imageUrl} />
      </div>
      <div className="cart-item-content">
        <div className="cart-item-top">
          <div>
            <span className="category-tag">{item.product.category}</span>
            <h3>{item.product.name}</h3>
          </div>
          <button
            className="ghost-inline-button"
            disabled={isBusy}
            type="button"
            onClick={() => onRemove(item.id)}
          >
            Remover
          </button>
        </div>

        <p>{item.product.description}</p>

        <div className="cart-item-meta">
          <span>Tamanho: {item.selectedSize}</span>
          <span>Cor: {item.selectedColor}</span>
          <span>Estoque da variacao: {item.product.stock}</span>
        </div>

        <div className="cart-item-bottom">
          <div className="quantity-control">
            <button
              disabled={isBusy || item.quantity <= 1}
              type="button"
              onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
            >
              -
            </button>
            <span>{item.quantity}</span>
            <button
              disabled={isBusy || !canIncrease}
              type="button"
              onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
            >
              +
            </button>
          </div>
          <strong>{formatCurrency(item.lineTotal)}</strong>
        </div>
      </div>
    </article>
  );
}
