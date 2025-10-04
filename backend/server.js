const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const branchRoutes = require("./routes/branchRoutes");
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const stockRoutes = require("./routes/stockRoutes");
const saleRoutes = require("./routes/saleRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const transferRoutes = require("./routes/transferRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const branches = require("./routes/setting/branches");
const branchProducts = require("./routes/setting/branchProducts");
const category = require("./routes/setting/categories");
const consignedProducts = require("./routes/setting/consignedProducts");
const products = require("./routes/setting/products");
const shops = require("./routes/setting/shops");
const suppliers = require("./routes/setting/suppliers");
const deliveryTemplates = require("./routes/setting/deliveryTemplates");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/delivery-docs", deliveryRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/settings/branches", branches);
app.use("/api/settings/branchProducts", branchProducts);
app.use("/api/settings/categories", category);
app.use("/api/settings/consignedProducts", consignedProducts);
app.use("/api/settings/products", products);
app.use("/api/settings/shops", shops);
app.use("/api/settings/suppliers", suppliers);
app.use("/api/settings/delivery-templates", deliveryTemplates);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
