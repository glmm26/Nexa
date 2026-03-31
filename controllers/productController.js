const {
  adjustAdminProductStock,
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  getCatalog,
  getProductDetails,
  updateAdminProduct,
} = require("../services/productService");
const { respondWithError } = require("../utils/respondWithError");

async function listProducts(req, res) {
  try {
    const result = await getCatalog({
      category: req.query.category,
      search: req.query.search,
      featuredOnly: req.query.featured === "1",
    });

    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function getProduct(req, res) {
  try {
    const result = await getProductDetails(Number.parseInt(req.params.id, 10));
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function listAdminProducts(req, res) {
  try {
    const result = await getAdminProducts();
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function createProductForAdmin(req, res) {
  try {
    const result = await createAdminProduct(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function updateProductForAdmin(req, res) {
  try {
    const result = await updateAdminProduct(Number.parseInt(req.params.id, 10), req.body);
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function deleteProductForAdmin(req, res) {
  try {
    const result = await deleteAdminProduct(Number.parseInt(req.params.id, 10));
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function updateProductStockForAdmin(req, res) {
  try {
    const result = await adjustAdminProductStock(
      Number.parseInt(req.params.id, 10),
      req.body.delta
    );
    return res.status(200).json(result);
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = {
  createProductForAdmin,
  deleteProductForAdmin,
  getProduct,
  listAdminProducts,
  listProducts,
  updateProductForAdmin,
  updateProductStockForAdmin,
};
