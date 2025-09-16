# Orders – Creation and Management

This document explains how supplier Orders are created, edited, approved/rejected, paid, and displayed across the system. It covers both frontend UI/UX and backend service behavior, including data flows, validation, and state transitions.

---

## High-level objectives

- Create supplier orders, add products, set per-line prices and quantities.
- Allow quick ordering from full barcode scans (scanner workflow).
- Auto-save edits with minimal friction.
- Approve/Reject orders with clear rules and side-effects.
- Accepting an order updates main product stock (and prices, when provided).
- Manage payments (billing & invoices) and display totals, debt, and progress.
- Present an orders list with key metrics and actions.

---

## Data model (backend)

Files:
- `backend/internal/models/order.go`
- `backend/internal/services/order_service.go`
- `backend/internal/repositories/order_repository.go`

Key types (abridged):
- `Order`
  - `id`, `tenant_id`, `name`, `type`, `supplier_id`, `shop_id`
  - `status_id`: `accepted`, `rejected`, or empty (in progress)
  - `is_finished`: boolean flag; accepted or rejected orders are finished
  - `external_id`: short numeric id generated on create (6-digit style)
  - Totals: `total_price`, `total_supply_price`, `total_retail_price`, `total_paid_amount`
  - Metadata: `created_by`, `accepted_by`, `accepting_date`, `payment_date`
  - `items: OrderItem[]` with `product_id`, `quantity`, `supply_price`, `retail_price`, `unit_price` (line unit), `total_price`
  - `payments: OrderPayment[]`
- `UpdateOrderRequest` has `action?: "approve" | "reject"` to finalize the order.

Important service logic:
- Create: generates `external_id` if missing, maps minimal `supplier`/`shop` info, computes totals.
- Update
  - When `action = approve` and order is not finished →
    - For each item: increase product stock by `quantity`.
    - If item `supply_price` or `retail_price` > 0, update product prices.
    - Set `is_finished = true`, `status_id = "accepted"`, stamp `accepted_by` and `accepting_date`.
  - When `action = reject` and order is not finished →
    - Set `is_finished = true`, `status_id = "rejected"`.
  - Otherwise updates fields and item collection.
- Delete: allowed only when order is not accepted (rejected/in-progress ok).

Indexes/Performance: order repository provides paginated listing with sorting and filtering; heavy aggregations are avoided in hot paths.

---

## REST API

- `GET /api/orders` — list with pagination and filters.
- `GET /api/orders/:id` — get single order with items & payments.
- `POST /api/orders` — create order.
- `PATCH /api/orders/:id` — update fields/items; set `action` for approve/reject.
- `DELETE /api/orders/:id` — delete (non-accepted only).
- `POST /api/orders/:id/payments` — add payment; increases `total_paid_amount`.

Payload notes:
- Items in create/update accept string `product_id`, and numeric `quantity`, `supply_price`, `retail_price`, `unit_price`. The service recomputes per-line `total_price` and order totals.
- Approve/Reject call uses `{ action: "approve" }` or `{ action: "reject" }`.

---

## Frontend – key components and files

- Orders list: `frontend/src/pages/orders/OrdersPage.tsx`
- Order detail: `frontend/src/pages/orders/OrderDetailPage.tsx`
- Table infrastructure: `frontend/src/components/common/CustomTable.tsx`
- Modals: `frontend/src/components/common/ConfirmModal.tsx`, `frontend/src/components/common/CustomModal.tsx`
- Services: `frontend/src/services/ordersService.ts`, `frontend/src/services/productsService.ts`
- UX building blocks: HeroUI components (`Tabs`, `Input`, `Select`, `Button`, `Tooltip`), `react-query` for data fetch, `react-toastify` for toasts
- Dates: `frontend/src/hooks/useDateFormatter.ts` (tenant-aware timezone formatting)

---

## Orders list (index)

Path: `/products/orders`

Table columns & logic (`OrdersPage.tsx`):
- ID: numeric `external_id` (fallback to numeric hex of db id)
- Name, Supplier, Store
- Status: translated chip — Accepted (green), Rejected (red), In progress (warning)
- Payment: two stacked rows with dots + tooltip
  - Paid amount (green)
  - Debt (red) = `total_supply_price` (or computed supply sum) − `total_paid_amount`
- Qty: `ordered / accepted` (if accepted available)
- Amount: three rows with dots + tooltip
  - Amount at the supply price
  - Amount at the retail price
  - Whole order amount (max of the above)
- Created (uses `useDateFormatter` with time)
- Shipment date (from `payment_date` for now)
- Created by / Accepted by
- Sales progress: bar computed as `paid/supply_amount` (interim logic)
- Actions: only available for rejected/in-progress; shows a delete (with confirm modal)

Create flows:
- “Create” opens a modal to choose supplier & store and **navigates to the new order detail** on success.
- For returns, a two-step modal selects a base supplier & store then chooses the source order.

---

## Order detail

Path: `/products/orders/:id`

Header:
- Buttons: Add payment, Reject, Accept, Back
  - Accept/Reject open confirm modals with order-specific messaging.
  - After Accept, the order is locked (read-only) and a green Accepted chip is shown.

Tabs:
1) Products
2) Main Information
3) Billing & Invoices

### Products tab

Implemented in `OrderDetailPage.tsx` with `CustomTable` and auxiliary state.

- Top tabs (pre-accept): `Ordered`, `All stocks`, `Low stock`, `Zero stock`
  - `Ordered`: shows only items already in the order; editable price/qty with **auto-save** (debounced) while not finished
  - Other tabs: show full product list with an “Order” (Add) button at row level
  - After order is accepted, only `Ordered` remains

- Columns: Name, SKU, Barcode, Current (stock), Supply price, Mark Up (%), Retail price, Qty
  - Mark Up is two-way: editing markup recomputes retail; editing retail recomputes markup (rounded)
  - Wider input widths for better UX

- Auto-save items:
  - Any change to qty/supply/retail triggers a debounced `PATCH /api/orders/:id` with items
  - Save is disabled when finished

- Scanner/auto-order workflow:
  - Typing/scanning a full barcode (8–14 digits) in the search field auto-adds or increments the matching product line
  - Immediately persists to the order and shows a toast: “Your order has been saved successfully.”
  - Search is cleared after a successful scan

### Main Information tab

- Displays a simplified set of statistics:
  - Order amount (supply), Retail amount, Paid amount, Debt amount, Goods count
- General info: Supplier, Store, Name, Created by, Accepted by, Notes
- Date & Time: Created, Accepting date, Payment term

### Billing & Invoices tab

- Payment list and right-side KPI cards
  - Order sum (supply), Sum of payments, Debt sum, Returns sum, Returned payments
- “Add payment” modal supports cash/cashless with amount and comment
- When opening the tab or adding a payment, the detail re-fetches the order so stats and list are up-to-date

---

## Status transitions & rules

- In progress (default) → can edit items and prices; can delete from list; can Accept/Reject.
- Accepted → order is locked; no edits, no delete. Stocks and (optional) prices are applied.
- Rejected → order is finished but can be deleted; no stock changes.

---

## Totals and progress

- Per-line `total_price` = `unit_price × quantity`.
- Order totals recomputed on create/update.
- Debt = supply total − paid total.
- Sales progress (interim) = `round(paid / supply_total × 100)`; can be replaced later by sales-derived metric.

---

## Payments

- Endpoint: `POST /api/orders/:id/payments` adds payment and increments `total_paid_amount`.
- Frontend updates:
  - Billing tab re-fetches the order after adding a payment.
  - Orders list shows paid/debt; it updates on next list fetch (and can be forced by invalidation if needed).

---

## Error handling & UX safeguards

- Confirm modal for delete action on orders list.
- Confirm modals for Accept/Reject in detail page with clear descriptions.
- Accepted orders are read-only across products & payments editing (business rule).
- Duplicate category subtree on edit — fixed by upserting and removing old children (see Category section below).

---

## Category subtree (related fix)

When editing a category subtree in `CategoryModal` (`frontend/src/pages/catalog/components/CategoryModal.tsx`):
- Updating a parent now:
  - Updates the parent itself
  - Deletes removed children
  - Updates existing children by id
  - Creates new children
  - Applies the same logic recursively to grandchildren
This prevents duplicate subcategories after edits.

---

## Developer tips

- Components
  - `CustomTable` provides top tabs, search, columns menu, pagination, selection, and a right action slot.
  - `ConfirmModal` is standardized for destructive/confirm actions.
  - HeroUI inputs (`Input`, `Select`, `Button`, `Tooltip`, `Tabs`) are used throughout; prefer consistent `classNames` and width presets.

- Services & hooks
  - Keep all backend calls in `ordersService.ts` / `productsService.ts`.
  - Use `useDateFormatter` for user/tenant-aware date & time display.
  - Persist order item changes via `PATCH /api/orders/:id` with an items array; rely on backend to recompute totals.

- Scanner integration
  - Keep the search field focused to allow scanner input.
  - We match exact barcodes and immediately persist with a toast.

---

## Future improvements

- Sales progress based on actual sales documents.
- Granular stock/reservation per warehouse if required.
- Bulk actions on items (set same supply/retail, remove lines).
- Reconciliation report: ordered vs accepted discrepancies.
- Payments: multi-currency, payment methods registry, refunds posting.

---

## Appendix: Example flows

### Create → detail
1) User opens Orders → clicks Create → selects Supplier/Store → submits → navigated to new order detail `/products/orders/:id`.
2) In Products tab, user adds products (table buttons or scanner), adjusts prices/qty; changes auto-save.
3) User can add payment anytime (header button or Billing tab).
4) When ready, click Accept → confirm → order becomes Accepted and locked; stocks updated.

### Reject flow
1) From detail, click Reject → confirm → order becomes Rejected; no stock updates.
2) From list, delete is available for rejected orders.

--- 