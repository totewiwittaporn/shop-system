# Codebase Review

## 1. Branch-level authorization gaps (High)
Many routes only require a valid JWT but never scope the data to the authenticated user's branch. For example, sale creation, listing, and cancellation all trust the `branchId` supplied in the request body/query without checking that the caller is allowed to act on that branch. The delivery document and report endpoints exhibit the same pattern. An attacker with any valid token can therefore read or mutate other branches' inventory and financial data by passing a different `branchId`.

* `routes/saleRoutes.js` uses only `authMiddleware` and works directly with the caller-provided `branchId` for creates, reads, and cancels without comparing it against `req.user` or enforcing a role. 【F:backend/routes/saleRoutes.js†L9-L167】
* `routes/deliveryDocs.js` and `routes/reportRoutes.js` likewise expose branch-specific lists and state changes to any authenticated user, again trusting `branchId` and `shopId` query/body parameters. 【F:backend/routes/deliveryDocs.js†L49-L148】【F:backend/routes/reportRoutes.js†L8-L124】

**Recommendation:** introduce branch- or role-aware guards (e.g., `checkRole` plus branch membership checks) that derive the effective branch from the token instead of client input, and ensure queries include that scope.

## 2. Multiple long-lived Prisma clients (Medium)
Nearly every route file instantiates its own `new PrismaClient()` at module scope. Because Node.js caches each module, these clients remain active for the lifetime of the process, leading to dozens of parallel database connections and higher memory pressure. In long-running or serverless environments this pattern often exhausts connection pools or slows cold starts.

* Examples include `routes/saleRoutes.js`, `routes/deliveryDocs.js`, and `routes/reportRoutes.js`, all of which create independent Prisma clients. 【F:backend/routes/saleRoutes.js†L2-L5】【F:backend/routes/deliveryDocs.js†L2-L5】【F:backend/routes/reportRoutes.js†L2-L5】

**Recommendation:** create a single shared Prisma client (e.g., `backend/prisma/client.js`) and reuse it across routes, or leverage Prisma's recommended singleton pattern.

## 3. Negative-quantity stock manipulation (High)
The sale creation flow validates inventory availability but never checks that `items[].quantity` is positive. Sending a negative quantity bypasses the "stock not enough" guard (`stock.quantity < item.quantity` is false when `item.quantity` is negative) and later decrements stock by a negative number, effectively increasing inventory instead of reducing it. This allows authenticated users to mint stock or produce inconsistent ledger entries.

* `routes/saleRoutes.js` maps the request payload directly into the transaction without enforcing `quantity > 0` or `price >= 0`. 【F:backend/routes/saleRoutes.js†L10-L65】

**Recommendation:** explicitly validate each sale item (positive quantity, reasonable price) before entering the transaction, and reject or sanitize invalid input.

