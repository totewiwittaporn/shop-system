// middleware/auth.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ authenticated: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ authenticated: false, error: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, branchId(optional) }
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ authenticated: false, error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
