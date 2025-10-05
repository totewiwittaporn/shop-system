const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// core
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/purchases", require("./routes/purchaseRoutes"));
app.use("/api/stocks", require("./routes/stockRoutes"));
app.use("/api/sales", require("./routes/saleRoutes"));
app.use("/api/suppliers", require("./routes/supplierRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/dashboards", require("./routes/dashboardRoutes"));

// settings
const branches = require("./routes/setting/branches");
app.use("/api/settings/branches", branches);
app.use("/api/branches", branches);                 // ← alias กันหน้าเก่า 404

app.use("/api/settings/branchProducts", require("./routes/setting/branchProducts"));
app.use("/api/settings/categories", require("./routes/setting/categories"));
app.use("/api/settings/consignedProducts", require("./routes/setting/consignedProducts"));
app.use("/api/v1/consigned-products", require("./routes/consignment/consigned-products"));
app.use("/api/settings/products", require("./routes/setting/products"));
app.use("/api/settings/shops", require("./routes/setting/shops"));
app.use("/api/settings/suppliers", require("./routes/setting/suppliers"));
app.use("/api/settings/delivery-templates", require("./routes/setting/deliveryTemplates"));

// draft & delivery docs
app.use("/api/stock-issue-drafts", require("./routes/stockIssueDrafts"));
const deliveryDocs = require("./routes/deliveryDocs");
app.use("/api/delivery-docs", deliveryDocs);
// app.use("/api/delivery", deliveryDocs);          // ← ถ้ามีหน้าเก่าเรียก /api/delivery ให้เปิด alias นี้ได้

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
