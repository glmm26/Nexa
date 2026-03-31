import { useEffect, useState } from "react";
import { AdminSectionNav } from "../components/admin/AdminSectionNav";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
} from "../services/adminProductService";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatCurrency } from "../utils/formatters";

function buildVariantKey(size, color) {
  return `${size}::${color}`;
}

function createVariantStockMap({ sizes = [], colors = [], variants = [] }) {
  const nextMap = {};

  for (const size of sizes) {
    for (const color of colors) {
      nextMap[buildVariantKey(size, color)] = "0";
    }
  }

  for (const variant of variants) {
    nextMap[buildVariantKey(variant.size, variant.color)] = String(variant.stock);
  }

  return nextMap;
}

function buildVariantPayload(sizes, colors, variantStockMap) {
  return sizes.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      stock: Number.parseInt(variantStockMap[buildVariantKey(size, color)] || "0", 10) || 0,
    }))
  );
}

function getTotalVariantStock(sizes, colors, variantStockMap) {
  return buildVariantPayload(sizes, colors, variantStockMap).reduce(
    (total, variant) => total + variant.stock,
    0
  );
}

function normalizeChipValue(value, lowercase = false) {
  const normalized = String(value || "").trim();
  return lowercase ? normalized.toLowerCase() : normalized;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "",
  availableSizes: [],
  availableColors: [],
  variantStockMap: {},
};

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productForm, setProductForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [busyProductId, setBusyProductId] = useState(null);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const { showToast } = useToast();

  useDocumentTitle("Admin | Produtos e estoque");

  useEffect(() => {
    fetchAdminProducts()
      .then((response) => {
        setProducts(response.products || []);
      })
      .catch((error) => {
        showToast(error.message, "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(emptyForm);
    setSizeDraft("");
    setColorDraft("");
  }

  function handleEditProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
      availableSizes: product.availableSizes || [],
      availableColors: product.availableColors || [],
      variantStockMap: createVariantStockMap({
        sizes: product.availableSizes || [],
        colors: product.availableColors || [],
        variants: product.variants || [],
      }),
    });
    setSizeDraft("");
    setColorDraft("");
  }

  function addSize() {
    const nextSize = normalizeChipValue(sizeDraft);

    if (!nextSize) {
      showToast("Digite um tamanho antes de adicionar.", "info");
      return;
    }

    if (productForm.availableSizes.includes(nextSize)) {
      showToast("Esse tamanho ja esta na grade.", "info");
      return;
    }

    setProductForm((current) => {
      const nextSizes = [...current.availableSizes, nextSize];
      const nextVariantStockMap = { ...current.variantStockMap };

      for (const color of current.availableColors) {
        nextVariantStockMap[buildVariantKey(nextSize, color)] = "0";
      }

      return {
        ...current,
        availableSizes: nextSizes,
        variantStockMap: nextVariantStockMap,
      };
    });
    setSizeDraft("");
  }

  function addColor() {
    const nextColor = normalizeChipValue(colorDraft, true);

    if (!nextColor) {
      showToast("Digite uma cor antes de adicionar.", "info");
      return;
    }

    if (productForm.availableColors.includes(nextColor)) {
      showToast("Essa cor ja esta cadastrada.", "info");
      return;
    }

    setProductForm((current) => {
      const nextColors = [...current.availableColors, nextColor];
      const nextVariantStockMap = { ...current.variantStockMap };

      for (const size of current.availableSizes) {
        nextVariantStockMap[buildVariantKey(size, nextColor)] = "0";
      }

      return {
        ...current,
        availableColors: nextColors,
        variantStockMap: nextVariantStockMap,
      };
    });
    setColorDraft("");
  }

  function removeSize(sizeToRemove) {
    setProductForm((current) => {
      const nextSizes = current.availableSizes.filter((size) => size !== sizeToRemove);
      const nextVariantStockMap = Object.fromEntries(
        Object.entries(current.variantStockMap).filter(([key]) => !key.startsWith(`${sizeToRemove}::`))
      );

      return {
        ...current,
        availableSizes: nextSizes,
        variantStockMap: nextVariantStockMap,
      };
    });
  }

  function removeColor(colorToRemove) {
    setProductForm((current) => {
      const nextColors = current.availableColors.filter((color) => color !== colorToRemove);
      const nextVariantStockMap = { ...current.variantStockMap };

      for (const size of current.availableSizes) {
        delete nextVariantStockMap[buildVariantKey(size, colorToRemove)];
      }

      return {
        ...current,
        availableColors: nextColors,
        variantStockMap: nextVariantStockMap,
      };
    });
  }

  function handleVariantStockChange(size, color, value) {
    if (value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setProductForm((current) => ({
      ...current,
      variantStockMap: {
        ...current.variantStockMap,
        [buildVariantKey(size, color)]: value,
      },
    }));
  }

  async function handleProductSubmit(event) {
    event.preventDefault();

    if (!productForm.availableSizes.length) {
      showToast("Adicione pelo menos um tamanho.", "info");
      return;
    }

    if (!productForm.availableColors.length) {
      showToast("Adicione pelo menos uma cor.", "info");
      return;
    }

    setIsSavingProduct(true);

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: productForm.price,
      imageUrl: productForm.imageUrl,
      category: productForm.category,
      availableSizes: productForm.availableSizes,
      availableColors: productForm.availableColors,
      variantStocks: buildVariantPayload(
        productForm.availableSizes,
        productForm.availableColors,
        productForm.variantStockMap
      ),
    };

    try {
      const response = editingProductId
        ? await updateAdminProduct(editingProductId, payload)
        : await createAdminProduct(payload);

      setProducts((current) => {
        if (editingProductId) {
          return current.map((product) =>
            product.id === editingProductId ? response.product : product
          );
        }

        return [response.product, ...current];
      });

      showToast(response.message, "success");
      resetProductForm();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct(productId) {
    setBusyProductId(productId);

    try {
      const response = await deleteAdminProduct(productId);
      setProducts((current) => current.filter((product) => product.id !== productId));
      showToast(response.message, "success");

      if (editingProductId === productId) {
        resetProductForm();
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyProductId(null);
    }
  }

  if (isLoading) {
    return <LoadingBlock label="Carregando produtos e estoque..." />;
  }

  const totalStock = getTotalVariantStock(
    productForm.availableSizes,
    productForm.availableColors,
    productForm.variantStockMap
  );

  return (
    <div className="shell-content section-space admin-page-stack">
      <SectionHeader
        eyebrow="Admin"
        title="Produtos e estoque"
        description="Controle o estoque por tamanho e cor, mantendo a grade real de cada produto."
      />

      <AdminSectionNav />

      <section className="profile-card">
        <div className="admin-table-head">
          <h2>{editingProductId ? "Editar produto e grade" : "Novo produto"}</h2>
          <p>
            Monte a grade de tamanhos e cores, depois informe o estoque de cada combinacao.
          </p>
        </div>

        <form className="form-panel" onSubmit={handleProductSubmit}>
          <label className="field-shell">
            <span>Nome</span>
            <input
              required
              type="text"
              value={productForm.name}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label className="field-shell">
            <span>Descricao</span>
            <textarea
              required
              rows="4"
              value={productForm.description}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <div className="field-grid">
            <label className="field-shell">
              <span>Preco</span>
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={productForm.price}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, price: event.target.value }))
                }
              />
            </label>

            <label className="field-shell">
              <span>Categoria</span>
              <input
                required
                type="text"
                value={productForm.category}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </label>
          </div>

          <label className="field-shell">
            <span>Imagem URL</span>
            <input
              required
              type="url"
              value={productForm.imageUrl}
              onChange={(event) =>
                setProductForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
            />
          </label>

          <div className="admin-variant-builder">
            <div className="admin-variant-block">
              <div className="admin-variant-head">
                <div>
                  <span className="summary-label">Tamanhos</span>
                  <h3>Grade de tamanhos</h3>
                </div>
              </div>
              <div className="admin-inline-form">
                <input
                  placeholder="P, M, 38, 40..."
                  type="text"
                  value={sizeDraft}
                  onChange={(event) => setSizeDraft(event.target.value)}
                />
                <button className="secondary-button compact-button" type="button" onClick={addSize}>
                  Adicionar tamanho
                </button>
              </div>
              <div className="variation-pill-list">
                {productForm.availableSizes.map((size) => (
                  <button
                    className="variation-pill variation-pill-removable"
                    key={size}
                    type="button"
                    onClick={() => removeSize(size)}
                  >
                    {size} x
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-variant-block">
              <div className="admin-variant-head">
                <div>
                  <span className="summary-label">Cores</span>
                  <h3>Cores disponiveis</h3>
                </div>
              </div>
              <div className="admin-inline-form">
                <input
                  placeholder="preto, branco, azul..."
                  type="text"
                  value={colorDraft}
                  onChange={(event) => setColorDraft(event.target.value)}
                />
                <button className="secondary-button compact-button" type="button" onClick={addColor}>
                  Adicionar cor
                </button>
              </div>
              <div className="variation-pill-list">
                {productForm.availableColors.map((color) => (
                  <button
                    className="variation-pill variation-pill-removable"
                    key={color}
                    type="button"
                    onClick={() => removeColor(color)}
                  >
                    {color} x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-variant-grid-shell">
            <div className="admin-table-head">
              <div>
                <span className="summary-label">Estoque por variacao</span>
                <h3>Matriz tamanho x cor</h3>
              </div>
              <strong>{totalStock} unidades no total</strong>
            </div>

            {productForm.availableSizes.length && productForm.availableColors.length ? (
              <div className="admin-variant-grid">
                <div className="admin-variant-grid-header">Tamanho</div>
                {productForm.availableColors.map((color) => (
                  <div className="admin-variant-grid-header" key={`header-${color}`}>
                    {color}
                  </div>
                ))}

                {productForm.availableSizes.map((size) => (
                  <div className="admin-variant-grid-row" key={size}>
                    <div className="admin-variant-grid-size">{size}</div>
                    {productForm.availableColors.map((color) => (
                      <input
                        key={buildVariantKey(size, color)}
                        min="0"
                        type="number"
                        value={productForm.variantStockMap[buildVariantKey(size, color)] || "0"}
                        onChange={(event) =>
                          handleVariantStockChange(size, color, event.target.value)
                        }
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="selection-helper">
                Adicione pelo menos um tamanho e uma cor para montar a grade de estoque.
              </p>
            )}
          </div>

          <div className="order-card-actions">
            <button className="primary-button compact-button" disabled={isSavingProduct} type="submit">
              {isSavingProduct
                ? "Salvando..."
                : editingProductId
                  ? "Salvar grade do produto"
                  : "Criar produto"}
            </button>
            {editingProductId ? (
              <button
                className="secondary-button compact-button"
                type="button"
                onClick={resetProductForm}
              >
                Cancelar edicao
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="profile-card">
        <div className="admin-table-head">
          <h2>Produtos cadastrados</h2>
          <p>Abra um produto para editar a grade e ajustar o estoque por cor e tamanho.</p>
        </div>

        <div className="admin-products-table admin-products-table-compact">
          {products.map((product) => (
            <div className="admin-product-summary-card" key={product.id}>
              <div className="admin-product-summary-main">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="admin-product-summary-meta">
                  <span>{product.category}</span>
                  <strong>{formatCurrency(product.price)}</strong>
                  <span
                    className={`admin-stock-badge ${
                      product.stock > 0 ? "admin-stock-badge-ok" : "admin-stock-badge-empty"
                    }`}
                  >
                    {product.stock} no total
                  </span>
                </div>
              </div>

              <div className="admin-product-summary-grid">
                <div>
                  <span className="summary-label">Tamanhos</span>
                  <div className="variation-pill-list">
                    {(product.availableSizes || []).map((size) => (
                      <span className="variation-pill" key={`${product.id}-summary-size-${size}`}>
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="summary-label">Cores</span>
                  <div className="variation-pill-list">
                    {(product.availableColors || []).map((color) => (
                      <span className="variation-pill" key={`${product.id}-summary-color-${color}`}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="summary-label">Grade atual</span>
                  <div className="admin-variant-preview-list">
                    {(product.variants || []).map((variant) => (
                      <span className="variation-pill" key={variant.id}>
                        {variant.size}/{variant.color}: {variant.stock}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-row-actions">
                <button
                  className="secondary-button compact-button"
                  type="button"
                  onClick={() => handleEditProduct(product)}
                >
                  Editar grade
                </button>
                <button
                  className="secondary-button compact-button danger-button"
                  disabled={busyProductId === product.id}
                  type="button"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  {busyProductId === product.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
