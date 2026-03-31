import { useEffect, useState } from "react";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  updateAdminProductStock,
} from "../services/adminProductService";
import { fetchAdminOrders, updateAdminOrderStatus } from "../services/orderService";
import { formatCurrency, formatDateTime, formatOrderStatus } from "../utils/formatters";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "",
  stock: "",
};

function getNextStatus(status) {
  if (status === "pendente") {
    return "confirmado";
  }

  if (status === "confirmado") {
    return "enviado";
  }

  return null;
}

export function AdminDashboardPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productForm, setProductForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [busyProductId, setBusyProductId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [stockAdjustments, setStockAdjustments] = useState({});
  const { showToast } = useToast();

  useDocumentTitle("Admin | NEXA");

  useEffect(() => {
    Promise.all([fetchAdminProducts(), fetchAdminOrders()])
      .then(([productsResponse, ordersResponse]) => {
        setProducts(productsResponse.products || []);
        setOrders(ordersResponse.orders || []);
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
  }

  function handleEditProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
      stock: String(product.stock),
    });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setIsSavingProduct(true);

    try {
      const response = editingProductId
        ? await updateAdminProduct(editingProductId, productForm)
        : await createAdminProduct(productForm);

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

  async function handleAdjustStock(product) {
    const delta = Number.parseInt(stockAdjustments[product.id] || "0", 10);

    if (!Number.isInteger(delta) || delta === 0) {
      showToast("Informe um ajuste de estoque diferente de zero.", "info");
      return;
    }

    setBusyProductId(product.id);

    try {
      const response = await updateAdminProductStock(product.id, { delta });
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? response.product : item))
      );
      setStockAdjustments((current) => ({
        ...current,
        [product.id]: "",
      }));
      showToast(response.message, "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleAdvanceStatus(order) {
    const nextStatus = getNextStatus(order.status);

    if (!nextStatus) {
      return;
    }

    setBusyOrderId(order.id);

    try {
      const response = await updateAdminOrderStatus(order.id, {
        status: nextStatus,
      });

      setOrders((current) =>
        current.map((item) => (item.id === order.id ? response.order : item))
      );
      showToast(response.message, "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyOrderId(null);
    }
  }

  if (isLoading) {
    return <LoadingBlock label="Carregando painel administrativo..." />;
  }

  return (
    <div className="shell-content section-space admin-dashboard">
      <SectionHeader
        eyebrow="Admin"
        title="Painel de produtos, estoque e pedidos."
        description="Gerencie o catalogo da loja, ajuste disponibilidade em tempo real e acompanhe os pedidos em um unico painel."
      />

      <div className="admin-layout">
        <section className="profile-card">
          <h2>{editingProductId ? "Editar produto" : "Novo produto"}</h2>
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
                <span>Estoque</span>
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={productForm.stock}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, stock: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="field-grid">
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
            </div>

            <div className="order-card-actions">
              <button className="primary-button compact-button" disabled={isSavingProduct} type="submit">
                {isSavingProduct
                  ? "Salvando..."
                  : editingProductId
                    ? "Atualizar produto"
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
          <h2>Produtos cadastrados</h2>
          <div className="admin-products-list">
            {products.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <div className="admin-product-head">
                  <div>
                    <h3>{product.name}</h3>
                    <p>
                      {product.category} · {formatCurrency(product.price)}
                    </p>
                  </div>
                  <span
                    className={`status-chip ${
                      product.stock > 0 ? "status-chip-success" : "status-chip-warning"
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} em estoque` : "Sem estoque"}
                  </span>
                </div>

                <p>{product.description}</p>

                <div className="admin-stock-row">
                  <label className="field-shell compact-field-shell">
                    <span>Ajuste de estoque</span>
                    <input
                      placeholder="+5 ou -2"
                      type="number"
                      value={stockAdjustments[product.id] || ""}
                      onChange={(event) =>
                        setStockAdjustments((current) => ({
                          ...current,
                          [product.id]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <button
                    className="secondary-button compact-button"
                    disabled={busyProductId === product.id}
                    type="button"
                    onClick={() => handleAdjustStock(product)}
                  >
                    {busyProductId === product.id ? "Salvando..." : "Atualizar estoque"}
                  </button>
                </div>

                <div className="order-card-actions">
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() => handleEditProduct(product)}
                  >
                    Editar
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
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="section-space">
        <SectionHeader
          eyebrow="Pedidos"
          title="Fluxo operacional da loja."
          description="Acompanhe pedidos realizados e avance o status conforme a operacao."
        />

        <StatusMessage tone="info" title="Fluxo de status">
          Os pedidos seguem a ordem pendente, confirmado e enviado.
        </StatusMessage>

        <div className="orders-stack admin-orders-stack">
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);

            return (
              <section className="order-card" key={order.id}>
                <div className="order-card-head">
                  <div className="order-card-title">
                    <span className="summary-label">Pedido #{order.id}</span>
                    <h2>{order.user.name}</h2>
                    <p>
                      {order.user.email} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="order-card-meta">
                    <span
                      className={`status-chip ${
                        order.status === "enviado" ? "status-chip-success" : "status-chip-warning"
                      }`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </div>

                <div className="order-summary-grid">
                  <div>
                    <span className="summary-label">Contato</span>
                    <strong>{order.customer.name}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Entrega</span>
                    <strong>
                      {order.customer.city} · {order.customer.zipCode}
                    </strong>
                  </div>
                  <div>
                    <span className="summary-label">Itens</span>
                    <strong>{order.items.length} produtos</strong>
                  </div>
                </div>

                <div className="order-items-list">
                  {order.items.map((item) => (
                    <article className="order-item-row" key={item.id}>
                      <div>
                        <h3>{item.productName}</h3>
                        <p>
                          {item.quantity}x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <strong>{formatCurrency(item.lineTotal)}</strong>
                    </article>
                  ))}
                </div>

                <div className="order-card-actions">
                  <button
                    className="primary-button compact-button"
                    disabled={!nextStatus || busyOrderId === order.id}
                    type="button"
                    onClick={() => handleAdvanceStatus(order)}
                  >
                    {!nextStatus
                      ? "Pedido finalizado"
                      : busyOrderId === order.id
                        ? "Atualizando..."
                        : `Marcar como ${formatOrderStatus(nextStatus)}`}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
