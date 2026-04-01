import { useEffect, useMemo, useState } from "react";
import { AdminConfirmDialog } from "../components/admin/AdminConfirmDialog";
import { AdminPagination } from "../components/admin/AdminPagination";
import { AdminProductCard } from "../components/admin/AdminProductCard";
import { AdminProductFilters } from "../components/admin/AdminProductFilters";
import { AdminProductFormModal } from "../components/admin/AdminProductFormModal";
import { AdminProductsSummary } from "../components/admin/AdminProductsSummary";
import { AdminSectionNav } from "../components/admin/AdminSectionNav";
import { AdminStockAdjustModal } from "../components/admin/AdminStockAdjustModal";
import {
  buildProductPayload,
  createEmptyProductForm,
  createProductFormFromProduct,
  createQuickStockPayload,
  filterProducts,
  getSummaryMetrics,
  normalizeChipValue,
  paginateProducts,
  sortProducts,
} from "../components/admin/adminProductUtils";
import { LoadingBlock } from "../components/ui/LoadingBlock";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
} from "../services/adminProductService";

const PAGE_SIZE = 6;

const initialFilters = {
  category: "all",
  inventory: "all",
  search: "",
  sortBy: "recent",
  status: "all",
};

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [productForm, setProductForm] = useState(createEmptyProductForm());
  const [editingProductId, setEditingProductId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [busyDeleteProductId, setBusyDeleteProductId] = useState(null);
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);
  const { showToast } = useToast();

  useDocumentTitle("Admin | Produtos e estoque");

  async function loadProducts(showPageLoading = true) {
    if (showPageLoading) {
      setIsLoading(true);
    }

    try {
      const response = await fetchAdminProducts();
      setProducts(response.products || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      if (showPageLoading) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort((left, right) => left.localeCompare(right, "pt-BR")),
    [products]
  );
  const summaryMetrics = useMemo(() => getSummaryMetrics(products), [products]);
  const filteredProducts = useMemo(() => filterProducts(products, filters), [products, filters]);
  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, filters.sortBy),
    [filteredProducts, filters.sortBy]
  );
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () => paginateProducts(sortedProducts, currentPage, PAGE_SIZE),
    [currentPage, sortedProducts]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function resetProductEditor() {
    setEditorOpen(false);
    setEditingProductId(null);
    setProductForm(createEmptyProductForm());
    setSizeDraft("");
    setColorDraft("");
  }

  function openCreateModal() {
    setEditingProductId(null);
    setProductForm(createEmptyProductForm());
    setSizeDraft("");
    setColorDraft("");
    setEditorOpen(true);
  }

  function openEditModal(product) {
    setEditingProductId(product.id);
    setProductForm(createProductFormFromProduct(product));
    setSizeDraft("");
    setColorDraft("");
    setEditorOpen(true);
  }

  function handleFilterChange(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFormFieldChange(field, value) {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
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
      const nextVariantStockMap = { ...current.variantStockMap };

      for (const color of current.availableColors) {
        nextVariantStockMap[`${nextSize}::${color}`] = "0";
      }

      return {
        ...current,
        availableSizes: [...current.availableSizes, nextSize],
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
      const nextVariantStockMap = { ...current.variantStockMap };

      for (const size of current.availableSizes) {
        nextVariantStockMap[`${size}::${nextColor}`] = "0";
      }

      return {
        ...current,
        availableColors: [...current.availableColors, nextColor],
        variantStockMap: nextVariantStockMap,
      };
    });
    setColorDraft("");
  }

  function removeSize(sizeToRemove) {
    setProductForm((current) => ({
      ...current,
      availableSizes: current.availableSizes.filter((size) => size !== sizeToRemove),
      variantStockMap: Object.fromEntries(
        Object.entries(current.variantStockMap).filter(
          ([key]) => !key.startsWith(`${sizeToRemove}::`)
        )
      ),
    }));
  }

  function removeColor(colorToRemove) {
    setProductForm((current) => {
      const nextVariantStockMap = { ...current.variantStockMap };

      for (const size of current.availableSizes) {
        delete nextVariantStockMap[`${size}::${colorToRemove}`];
      }

      return {
        ...current,
        availableColors: current.availableColors.filter((color) => color !== colorToRemove),
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
        [`${size}::${color}`]: value,
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

    try {
      const payload = buildProductPayload(
        productForm,
        editingProductId ? "Edicao manual do produto pelo painel" : "Cadastro inicial do produto"
      );
      const response = editingProductId
        ? await updateAdminProduct(editingProductId, payload)
        : await createAdminProduct(payload);

      showToast(response.message, "success");
      resetProductEditor();
      await loadProducts(false);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleQuickStockSubmit(adjustment) {
    if (!stockModalProduct) {
      return;
    }

    setIsSavingStock(true);

    try {
      const nextForm = createQuickStockPayload(stockModalProduct, adjustment);
      const payload = buildProductPayload(nextForm, nextForm.movementReason);
      const response = await updateAdminProduct(stockModalProduct.id, payload);
      showToast(response.message, "success");
      setStockModalProduct(null);
      await loadProducts(false);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSavingStock(false);
    }
  }

  async function handleDeleteProduct() {
    if (!pendingDeleteProduct) {
      return;
    }

    setBusyDeleteProductId(pendingDeleteProduct.id);

    try {
      const response = await deleteAdminProduct(pendingDeleteProduct.id);
      showToast(response.message, "success");
      setPendingDeleteProduct(null);
      setExpandedProductId((current) => (current === pendingDeleteProduct.id ? null : current));
      await loadProducts(false);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyDeleteProductId(null);
    }
  }

  if (isLoading) {
    return <LoadingBlock label="Carregando produtos e estoque..." />;
  }

  return (
    <div className="shell-content section-space admin-page-stack admin-products-shell">
      <SectionHeader
        eyebrow="Admin"
        title="Produtos e estoque"
        description="Painel redesenhado para operacao diaria: mais claro para cadastrar, mais rapido para ajustar estoque e melhor para enxergar prioridades."
      />

      <AdminSectionNav />
      <AdminProductsSummary metrics={summaryMetrics} />

      <AdminProductFilters
        categories={categories}
        filters={filters}
        totalProducts={products.length}
        totalResults={sortedProducts.length}
        onCreateProduct={openCreateModal}
        onFilterChange={handleFilterChange}
      />

      {paginatedProducts.length ? (
        <section className="admin-catalog-grid">
          {paginatedProducts.map((product) => (
            <AdminProductCard
              isBusy={busyDeleteProductId === product.id}
              isExpanded={expandedProductId === product.id}
              key={product.id}
              product={product}
              onDelete={() => setPendingDeleteProduct(product)}
              onEdit={() => openEditModal(product)}
              onQuickStock={() => setStockModalProduct(product)}
              onToggleDetails={() =>
                setExpandedProductId((current) => (current === product.id ? null : product.id))
              }
            />
          ))}
        </section>
      ) : (
        <section className="empty-panel">
          <h2>Nenhum produto corresponde aos filtros atuais.</h2>
          <p>Ajuste a busca, limpe os filtros ou cadastre um novo item para continuar.</p>
          <button className="primary-button" type="button" onClick={openCreateModal}>
            Cadastrar produto
          </button>
        </section>
      )}

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChangePage={setCurrentPage}
      />

      {editorOpen ? (
        <AdminProductFormModal
          colorDraft={colorDraft}
          editingProductId={editingProductId}
          form={productForm}
          isSaving={isSavingProduct}
          sizeDraft={sizeDraft}
          onAddColor={addColor}
          onAddSize={addSize}
          onChangeColorDraft={setColorDraft}
          onChangeField={handleFormFieldChange}
          onChangeSizeDraft={setSizeDraft}
          onChangeVariantStock={handleVariantStockChange}
          onClose={resetProductEditor}
          onRemoveColor={removeColor}
          onRemoveSize={removeSize}
          onSubmit={handleProductSubmit}
        />
      ) : null}

      {stockModalProduct ? (
        <AdminStockAdjustModal
          isSaving={isSavingStock}
          product={stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onSubmit={handleQuickStockSubmit}
        />
      ) : null}

      {pendingDeleteProduct ? (
        <AdminConfirmDialog
          isBusy={busyDeleteProductId === pendingDeleteProduct.id}
          productName={pendingDeleteProduct.name}
          onCancel={() => setPendingDeleteProduct(null)}
          onConfirm={handleDeleteProduct}
        />
      ) : null}
    </div>
  );
}
