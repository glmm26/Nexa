import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/catalog/ProductCard";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { fetchProduct } from "../services/catalogService";
import { formatCurrency } from "../utils/formatters";

const COLOR_SWATCHES = {
  preto: "#141414",
  branco: "#f5f5f0",
  azul: "#365df0",
  bege: "#b89874",
  cinza: "#8e9097",
  marrom: "#72533e",
  verde: "#446b57",
  vermelho: "#b33f4a",
};

function toLabel(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getColorSwatch(color) {
  const normalized = String(color || "").trim().toLowerCase();
  return COLOR_SWATCHES[normalized] || normalized || "#444444";
}

function hasVariantStock(variants, size, color) {
  return variants.some((variant) => {
    const sameSize = variant.size === size;
    const sameColor = color ? variant.color === color : true;
    return sameSize && sameColor && variant.stock > 0;
  });
}

function hasColorStock(variants, color, size) {
  return variants.some((variant) => {
    const sameColor = variant.color === color;
    const sameSize = size ? variant.size === size : true;
    return sameColor && sameSize && variant.stock > 0;
  });
}

export function ProductPage() {
  const { productId } = useParams();
  const [data, setData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState(null);

  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);

    fetchProduct(productId)
      .then((response) => {
        setData(response);
        setQuantity(1);
        setSelectedSize("");
        setSelectedColor("");
      })
      .catch((error) => {
        showToast(error.message, "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  useDocumentTitle(data ? `${data.product.name} | NEXA` : "Produto | NEXA");

  async function handleAddToCart(targetProduct, nextQuantity = 1) {
    if (!isAuthenticated) {
      showToast("Entre para adicionar produtos ao carrinho.", "info");
      navigate("/login", {
        state: {
          from: location.pathname,
        },
      });
      return;
    }

    if (!selectedSize || !selectedColor) {
      showToast("Selecione tamanho e cor antes de adicionar ao carrinho.", "info");
      return;
    }

    setBusyProductId(targetProduct.id);

    try {
      await addItem({
        productId: targetProduct.id,
        quantity: nextQuantity,
        size: selectedSize,
        color: selectedColor,
      });
      showToast("Produto adicionado com sucesso.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyProductId(null);
    }
  }

  const product = data?.product;
  const relatedProducts = data?.relatedProducts || [];
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const availableSizes = Array.isArray(product?.availableSizes) ? product.availableSizes : [];
  const availableColors = Array.isArray(product?.availableColors) ? product.availableColors : [];
  const selectedVariant = variants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor
  );
  const visibleStock = selectedVariant ? selectedVariant.stock : product.stock;
  const maxSelectableQuantity = Math.max(1, Math.min(visibleStock || 1, 99));
  const isSelectionComplete = Boolean(selectedSize && selectedColor);
  const canAddSelectedVariant = Boolean(selectedVariant && selectedVariant.stock > 0);

  useEffect(() => {
    setQuantity((current) => Math.min(current, maxSelectableQuantity));
  }, [maxSelectableQuantity]);

  if (isLoading) {
    return <LoadingBlock label="Carregando produto..." />;
  }

  if (!data || !product) {
    return (
      <div className="shell-content section-space">
        <div className="empty-panel">
          <h2>Produto indisponivel.</h2>
          <p>Volte para a vitrine e escolha outra peca da colecao.</p>
          <Link className="primary-button" to="/">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="shell-content section-space">
        <div className="product-layout">
          <div className="product-gallery-panel">
            <img alt={product.name} src={product.imageUrl} />
          </div>

          <div className="product-detail-panel">
            <Link className="inline-link" to="/">
              Voltar para a loja
            </Link>
            <div className="product-card-meta">
              <span className="section-kicker">Nova colecao</span>
              <span className="category-tag">{product.category}</span>
            </div>
            <h1>{product.name}</h1>
            <p className="lead-copy">{product.description}</p>

            <div className="price-row">
              <strong>{formatCurrency(product.price)}</strong>
              <span>
                {isSelectionComplete
                  ? canAddSelectedVariant
                    ? `${selectedVariant.stock} unidade(s) nesta variacao`
                    : "Variacao sem estoque"
                  : product.stock > 0
                    ? `${product.stock} unidade(s) no total`
                    : "Sem estoque"}
              </span>
            </div>

            <div className="product-option-group">
              <div className="product-option-head">
                <span>Tamanho</span>
                <strong>{selectedSize ? toLabel(selectedSize) : "Escolha um tamanho"}</strong>
              </div>
              <div className="option-chip-row">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    className={`option-chip ${selectedSize === size ? "option-chip-active" : ""}`}
                    disabled={!hasVariantStock(variants, size, selectedColor)}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);

                      if (selectedColor && !hasColorStock(variants, selectedColor, size)) {
                        setSelectedColor("");
                      }
                    }}
                  >
                    {toLabel(size)}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-option-group">
              <div className="product-option-head">
                <span>Cor</span>
                <strong>{selectedColor ? toLabel(selectedColor) : "Escolha uma cor"}</strong>
              </div>
              <div className="color-chip-row">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    className={`color-chip ${selectedColor === color ? "color-chip-active" : ""}`}
                    disabled={!hasColorStock(variants, color, selectedSize)}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);

                      if (selectedSize && !hasVariantStock(variants, selectedSize, color)) {
                        setSelectedSize("");
                      }
                    }}
                  >
                    <span
                      className="color-chip-swatch"
                      style={{ backgroundColor: getColorSwatch(color) }}
                    />
                    <span>{toLabel(color)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="benefit-grid">
              <div>
                <strong>Frete por CEP</strong>
                <span>Consulte o valor e o prazo no carrinho antes de fechar o pedido.</span>
              </div>
              <div>
                <strong>Troca simplificada</strong>
                <span>Atendimento rapido para continuar a compra com seguranca.</span>
              </div>
              <div>
                <strong>Compra protegida</strong>
                <span>Conta com verificacao por email e checkout sem etapas extras.</span>
              </div>
            </div>

            <div className="quantity-row">
              <span>Quantidade</span>
              <div className="quantity-control">
                <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(maxSelectableQuantity, current + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="hero-actions">
              <button
                className="primary-button"
                disabled={
                  busyProductId === product.id ||
                  product.stock <= 0 ||
                  !isSelectionComplete ||
                  !canAddSelectedVariant
                }
                type="button"
                onClick={() => handleAddToCart(product, quantity)}
              >
                {product.stock <= 0
                  ? "Produto indisponivel"
                  : isSelectionComplete && !canAddSelectedVariant
                    ? "Variacao sem estoque"
                  : !isSelectionComplete
                    ? "Escolha tamanho e cor"
                  : busyProductId === product.id
                    ? "Adicionando..."
                    : "Adicionar ao carrinho"}
              </button>
              <Link className="secondary-button" to="/carrinho">
                Ver carrinho
              </Link>
            </div>

            {!isSelectionComplete ? (
              <p className="selection-helper">
                Antes de comprar, selecione a variacao completa da peca.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="shell-content section-space">
        <SectionHeader
          eyebrow="Relacionados"
          title="Complete o look."
          description="Mais produtos da mesma categoria para continuar comprando."
        />
        <div className="product-grid">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard
              key={relatedProduct.id}
              isBusy={busyProductId === relatedProduct.id}
              product={relatedProduct}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
