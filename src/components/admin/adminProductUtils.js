const LIMITE_ESTOQUE_BAIXO = 10;

export function buildVariantKey(size, color) {
  return `${size}::${color}`;
}

export function normalizeChipValue(value, lowercase = false) {
  const normalized = String(value || "").trim();
  return lowercase ? normalized.toLowerCase() : normalized;
}

export function createVariantStockMap({ sizes = [], colors = [], variants = [] }) {
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

export function buildVariantPayload(sizes, colors, variantStockMap) {
  return sizes.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      stock: Number.parseInt(variantStockMap[buildVariantKey(size, color)] || "0", 10) || 0,
    }))
  );
}

export function getTotalVariantStock(sizes, colors, variantStockMap) {
  return buildVariantPayload(sizes, colors, variantStockMap).reduce(
    (total, variant) => total + variant.stock,
    0
  );
}

export function createEmptyProductForm() {
  return {
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
    status: "ativo",
    availableSizes: [],
    availableColors: [],
    variantStockMap: {},
  };
}

export function createProductFormFromProduct(product) {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    imageUrl: product.imageUrl,
    category: product.category,
    status: product.status || "ativo",
    availableSizes: product.availableSizes || [],
    availableColors: product.availableColors || [],
    variantStockMap: createVariantStockMap({
      sizes: product.availableSizes || [],
      colors: product.availableColors || [],
      variants: product.variants || [],
    }),
  };
}

export function buildProductPayload(productForm, movementReason = "") {
  return {
    name: productForm.name,
    description: productForm.description,
    price: productForm.price,
    imageUrl: productForm.imageUrl,
    category: productForm.category,
    status: productForm.status,
    availableSizes: productForm.availableSizes,
    availableColors: productForm.availableColors,
    variantStocks: buildVariantPayload(
      productForm.availableSizes,
      productForm.availableColors,
      productForm.variantStockMap
    ),
    movementReason,
  };
}

export function getProductStatus(product) {
  return product.status || "ativo";
}

export function getInventoryTone(product) {
  if (product.stock <= 0) {
    return "empty";
  }

  if (product.stock < LIMITE_ESTOQUE_BAIXO) {
    return "low";
  }

  return "healthy";
}

export function getInventoryLabel(product) {
  if (product.stock <= 0) {
    return "Sem estoque";
  }

  if (product.stock < LIMITE_ESTOQUE_BAIXO) {
    return `Estoque baixo (${product.stock})`;
  }

  return `${product.stock} unidades`;
}

export function getSummaryMetrics(products) {
  return {
    total: products.length,
    ativos: products.filter((product) => getProductStatus(product) === "ativo").length,
    inativos: products.filter((product) => getProductStatus(product) === "inativo").length,
    baixoEstoque: products.filter(
      (product) => product.stock > 0 && product.stock < LIMITE_ESTOQUE_BAIXO
    ).length,
    semEstoque: products.filter((product) => product.stock <= 0).length,
  };
}

export function filterProducts(products, filters) {
  return products.filter((product) => {
    const matchesSearch =
      !filters.search ||
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory =
      filters.category === "all" || product.category === filters.category;

    const matchesStatus =
      filters.status === "all" || getProductStatus(product) === filters.status;

    const matchesInventory =
      filters.inventory === "all" ||
      (filters.inventory === "in-stock" && product.stock > 0) ||
      (filters.inventory === "low" &&
        product.stock > 0 &&
        product.stock < LIMITE_ESTOQUE_BAIXO) ||
      (filters.inventory === "out" && product.stock <= 0) ||
      (filters.inventory === "healthy" && product.stock >= LIMITE_ESTOQUE_BAIXO);

    return matchesSearch && matchesCategory && matchesStatus && matchesInventory;
  });
}

export function sortProducts(products, sortBy) {
  const sortedProducts = [...products];

  sortedProducts.sort((left, right) => {
    switch (sortBy) {
      case "name":
        return left.name.localeCompare(right.name, "pt-BR");
      case "price":
        return right.price - left.price;
      case "stock":
        return right.stock - left.stock;
      case "category":
        return left.category.localeCompare(right.category, "pt-BR");
      default:
        return right.id - left.id;
    }
  });

  return sortedProducts;
}

export function paginateProducts(products, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  return products.slice(startIndex, startIndex + pageSize);
}

export function createQuickStockPayload(product, adjustment) {
  const variantStockMap = createVariantStockMap({
    sizes: product.availableSizes || [],
    colors: product.availableColors || [],
    variants: product.variants || [],
  });
  const targetKey = buildVariantKey(adjustment.size, adjustment.color);
  const currentStock = Number.parseInt(variantStockMap[targetKey] || "0", 10) || 0;
  const delta = adjustment.type === "entry" ? adjustment.quantity : -adjustment.quantity;
  const nextStock = currentStock + delta;

  if (nextStock < 0) {
    throw new Error("A saida nao pode deixar a variacao com estoque negativo.");
  }

  variantStockMap[targetKey] = String(nextStock);

  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    imageUrl: product.imageUrl,
    category: product.category,
    status: getProductStatus(product),
    availableSizes: product.availableSizes || [],
    availableColors: product.availableColors || [],
    variantStockMap,
    movementReason:
      adjustment.reason ||
      (adjustment.type === "entry"
        ? "Entrada manual no painel administrativo"
        : "Saida manual no painel administrativo"),
  };
}

export function getVariantOptions(product) {
  return (product.variants || []).map((variant) => ({
    key: buildVariantKey(variant.size, variant.color),
    label: `${variant.size} / ${variant.color}`,
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
  }));
}

export function formatMovementDelta(delta) {
  return delta > 0 ? `+${delta}` : String(delta);
}

export { LIMITE_ESTOQUE_BAIXO };
