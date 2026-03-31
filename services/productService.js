const {
  createProduct,
  deleteProductById,
  getProductById,
  hasOrdersForProduct,
  listCategories,
  listProducts,
  updateProductById,
} = require("../database/database");
const { createHttpError } = require("../utils/httpError");

function mapVariant(variant) {
  return {
    id: variant.id,
    size: variant.tamanho,
    color: variant.cor,
    stock: Number(variant.estoque),
  };
}

function mapProduct(product) {
  const variants = Array.isArray(product.variants) ? product.variants.map(mapVariant) : [];

  return {
    id: product.id,
    name: product.nome,
    description: product.descricao,
    price: Number(product.preco),
    imageUrl: product.imagem_url,
    category: product.categoria,
    stock: Number(product.estoque),
    inStock: Number(product.estoque) > 0,
    availableSizes: product.tamanhos_disponiveis || [],
    availableColors: product.cores_disponiveis || [],
    variants,
  };
}

function parseVariationInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeColorInput(colors) {
  return parseVariationInput(colors).map((color) => color.toLowerCase());
}

function normalizeVariantStocks(rawVariantStocks, sizes, colors) {
  const allowedSizes = new Set(sizes);
  const allowedColors = new Set(colors);
  const stockByKey = new Map();
  const variantEntries = Array.isArray(rawVariantStocks) ? rawVariantStocks : [];

  for (const entry of variantEntries) {
    const size = String(entry?.size || "").trim();
    const color = String(entry?.color || "").trim().toLowerCase();
    const stock = Number.parseInt(entry?.stock, 10);

    if (!size || !color) {
      continue;
    }

    if (!allowedSizes.has(size)) {
      throw createHttpError(400, `O tamanho ${size} nao faz parte da grade do produto.`);
    }

    if (!allowedColors.has(color)) {
      throw createHttpError(400, `A cor ${color} nao faz parte da grade do produto.`);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw createHttpError(400, "Informe um estoque valido para cada variacao.");
    }

    stockByKey.set(`${size}::${color}`, stock);
  }

  return sizes.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      stock: stockByKey.get(`${size}::${color}`) || 0,
    }))
  );
}

function normalizeProductPayload(payload) {
  const nome = String(payload.name || "").trim();
  const descricao = String(payload.description || "").trim();
  const imagemUrl = String(payload.imageUrl || "").trim();
  const categoria = String(payload.category || "").trim().toLowerCase();
  const preco = Number(payload.price);
  const tamanhosDisponiveis = parseVariationInput(payload.availableSizes);
  const coresDisponiveis = normalizeColorInput(payload.availableColors);
  const variantStocks = normalizeVariantStocks(
    payload.variantStocks,
    tamanhosDisponiveis,
    coresDisponiveis
  );

  if (!nome || !descricao || !imagemUrl || !categoria) {
    throw createHttpError(400, "Preencha nome, descricao, imagem e categoria do produto.");
  }

  if (!Number.isFinite(preco) || preco <= 0) {
    throw createHttpError(400, "Informe um preco valido para o produto.");
  }

  if (!tamanhosDisponiveis.length) {
    throw createHttpError(400, "Informe ao menos um tamanho disponivel.");
  }

  if (!coresDisponiveis.length) {
    throw createHttpError(400, "Informe ao menos uma cor disponivel.");
  }

  return {
    nome,
    descricao,
    preco,
    imagemUrl,
    categoria,
    tamanhosDisponiveis,
    coresDisponiveis,
    variantStocks,
  };
}

async function getCatalog({ category, search, featuredOnly } = {}) {
  const products = await listProducts({
    category,
    search,
    limit: featuredOnly ? 4 : undefined,
  });
  const categories = await listCategories();

  return {
    products: products.map(mapProduct),
    categories,
  };
}

async function getProductDetails(productId) {
  const product = await getProductById(productId);

  if (!product) {
    throw createHttpError(404, "Produto nao encontrado.");
  }

  const relatedProducts = await listProducts({
    category: product.categoria,
    limit: 4,
  });

  return {
    product: mapProduct(product),
    relatedProducts: relatedProducts
      .filter((relatedProduct) => relatedProduct.id !== product.id)
      .slice(0, 3)
      .map(mapProduct),
  };
}

async function getAdminProducts() {
  const products = await listProducts();

  return {
    products: products.map(mapProduct),
  };
}

async function createAdminProduct(payload) {
  const normalized = normalizeProductPayload(payload);
  const product = await createProduct(normalized);

  return {
    message: "Produto criado com sucesso.",
    product: mapProduct(product),
  };
}

async function updateAdminProduct(productId, payload) {
  const existingProduct = await getProductById(productId);

  if (!existingProduct) {
    throw createHttpError(404, "Produto nao encontrado.");
  }

  const normalized = normalizeProductPayload(payload);
  const product = await updateProductById(productId, normalized);

  return {
    message: "Produto atualizado com sucesso.",
    product: mapProduct(product),
  };
}

async function deleteAdminProduct(productId) {
  const existingProduct = await getProductById(productId);

  if (!existingProduct) {
    throw createHttpError(404, "Produto nao encontrado.");
  }

  if (await hasOrdersForProduct(productId)) {
    throw createHttpError(
      400,
      "Este produto ja faz parte de pedidos e nao pode ser excluido."
    );
  }

  await deleteProductById(productId);

  return {
    message: "Produto removido com sucesso.",
  };
}

async function adjustAdminProductStock() {
  throw createHttpError(
    400,
    "O estoque agora e controlado por tamanho e cor. Edite a grade de variacoes do produto."
  );
}

module.exports = {
  adjustAdminProductStock,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  getCatalog,
  getProductDetails,
  updateAdminProduct,
};
