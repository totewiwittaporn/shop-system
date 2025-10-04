// routes/setting/index.js
const express = require("express");
const router = express.Router();

// ✅ Import route ย่อย
const categoriesRouter = require("./categories");
const productsRouter = require("./products");
const branchesRouter = require("./branches");
const shopsRouter = require("./shops");
const branchProductsRouter = require("./branchProducts");
const consignedProductsRouter = require("./consignedProducts");

// ✅ Mount route ย่อย
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/branches", branchesRouter);
router.use("/shops", shopsRouter);
router.use("/branchProducts", branchProductsRouter);
router.use("/consignedProducts", consignedProductsRouter);

module.exports = router;
