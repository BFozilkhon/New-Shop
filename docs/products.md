## Products module – backend & frontend (creation flow)

This document explains how the Products feature is implemented across backend and frontend, with a focus on the create flow. File paths are referenced so you can jump directly to the relevant code.

### Backend overview

- Entry points
  - Handler: `backend/internal/handlers/product_handler.go`
  - Service: `backend/internal/services/product_service.go`
  - Repository: `backend/internal/repositories/product_repository.go`
  - Model & DTOs: `backend/internal/models/product.go`

- Tenancy
  - The resolved tenant id is stored in `c.Locals("tenant_id")` by middleware and passed to the service layer.
  - All queries scope by `tenant_id` to isolate data per tenant.

#### Data model (simplified)
- Core struct: `models.Product`
  - Required: `name`, `sku`, `price` (>= 0)
  - Common fields: `description`, `price`, `cost_price`, `stock`, `unit`, `weight`, `dimensions{length,width,height,unit}`
  - Relations (optional): `category_id`, `brand_id`, `supplier_id` (stored as MongoDB ObjectIDs)
  - Catalog relationships: `catalog_attributes`, `catalog_characteristics`, `catalog_parameters`
  - Bundle support: `type`, `is_bundle`, `bundle_items`, `bundle_price`
  - Operational flags: `status` (active|inactive|discontinued), `is_published`, `is_active`
  - Timestamps: `created_at`, `updated_at`
- DTOs: `models.ProductDTO`
  - Adds derived relationship names: `category_name`, `brand_name`, `supplier_name`
  - Converts ObjectIDs to hex strings

#### API endpoints
- `GET /api/products` – list with filters/pagination
- `GET /api/products/:id` – fetch one by id
- `POST /api/products` – create product
- `PATCH /api/products/:id` – partial update
- `DELETE /api/products/:id` – delete
- `PATCH /api/products/:id/stock` – update only stock

All endpoints return the success envelope from `utils/response.go`.

#### Create flow (POST /api/products)
1. Handler `Create` in `product_handler.go`:
   - Parses the body into `models.ProductCreate`
   - Reads `tenantID := c.Locals("tenant_id").(string)`
   - Calls `svc.Create(ctx, body, tenantID)`
2. Service `Create` in `product_service.go`:
   - Validations:
     - `name` required
     - `sku` required and unique per tenant (`repo.CheckSKUExists`)
     - `price` must be non-negative
     - For relations (`category_id`, `brand_id`, `supplier_id`), verifies existence
   - Maps `ProductCreate` → `models.Product`
   - Converts string relation ids to `primitive.ObjectID`
   - Defaults (`is_active=true`, `status=active`, `type=single`) are set in repository `Create`
   - Inserts via `repo.Create`
   - Returns a `ProductDTO` by calling `Get` to also hydrate relationship names
3. Repository `Create` in `product_repository.go`:
   - Assigns timestamps
   - Ensures arrays are non-nil
   - Inserts into `products` collection

Example request
```bash
curl -X POST http://localhost:8081/api/products \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-objectid-hex>" \
  -d '{
    "name": "iPhone 15 Pro",
    "sku": "IP15P-256-GR",
    "description": "Flagship phone",
    "price": 1299,
    "cost_price": 980,
    "stock": 20,
    "unit": "pcs",
    "weight": 0.187,
    "dimensions": {"length": 14.6, "width": 7.1, "height": 0.8, "unit": "cm"},
    "category_id": "<category-id>",
    "brand_id": "<brand-id>",
    "supplier_id": "<supplier-id>",
    "images": [],
    "attributes": [],
    "variants": [],
    "warehouses": [],
    "catalog_attributes": [],
    "catalog_characteristics": [],
    "catalog_parameters": [],
    "type": "single",
    "is_bundle": false,
    "barcode": "1234567890123",
    "is_dirty_core": false,
    "is_realizatsiya": false,
    "is_konsignatsiya": false,
    "additional_parameters": {},
    "status": "active",
    "is_published": true
  }'
```

Example response (201)
```json
{
  "data": {
    "id": "6650b9…",
    "tenant_id": "6650a1…",
    "name": "iPhone 15 Pro",
    "sku": "IP15P-256-GR",
    "description": "Flagship phone",
    "price": 1299,
    "stock": 20,
    "unit": "pcs",
    "weight": 0.187,
    "dimensions": {"length":14.6,"width":7.1,"height":0.8,"unit":"cm"},
    "category_id": "...",
    "category_name": "Smartphones",
    "brand_id": "...",
    "brand_name": "Apple",
    "supplier_id": "...",
    "supplier_name": "Apple Inc.",
    "images": [],
    "attributes": [],
    "variants": [],
    "warehouses": [],
    "type": "single",
    "is_bundle": false,
    "status": "active",
    "is_published": true,
    "is_active": true,
    "created_at": "2025-…",
    "updated_at": "2025-…"
  }
}
```

#### Error handling
- Uses `utils.BadRequest`, `utils.NotFound`, `utils.Internal`. Internal error details are not exposed to the client.
- Example error (409 SKU exists): `{ "error": { "code": "SKU_EXISTS", "message": "Product with this SKU already exists" } }`

### Frontend overview

- API client: `frontend/src/services/productsService.ts`
  - `list`, `get`, `create`, `update`, `remove`, `updateStock`
  - Strongly typed payloads for editor assistance
- Pages
  - List: `frontend/src/pages/products/ProductsPage.tsx`
  - Create: `frontend/src/pages/products/ProductCreatePage.tsx`
  - Edit/View: `frontend/src/pages/products/ProductEditPage.tsx`

#### Create UI flow
- Location: `ProductCreatePage.tsx`
- State and sections
  - Four sections: Main Information, Prices, Product Quantity, Characteristics
  - Uses HeroUI `Input`, `Select`, `Textarea`, `Switch`, and `CustomDocumentUpload` for images
  - Dropdown data via TanStack Query (`categoriesService`, `brandsService`, `suppliersService`, `attributesService`, `characteristicsService`)
- Submission
  - `useMutation` calls `productsService.create(payload)`
  - Minimal validation on the client before submission (name, sku, price)
  - On success: toast, invalidate `['products']`, navigate to `/products/catalog`

Create payload shape (frontend → backend)
```ts
const payload = {
  name, sku, part_number, description,
  price, cost_price,
  stock, min_stock, max_stock,
  unit, weight,
  dimensions, // { length, width, height, unit }
  category_id: categoryId || undefined,
  brand_id: brandId || undefined,
  supplier_id: supplierId || undefined,
  images,
  attributes: [],
  variants: [],
  warehouses: [],
  catalog_attributes: [],
  catalog_characteristics: [],
  catalog_parameters: [],
  type: 'single',
  is_bundle: false,
  barcode,
  is_dirty_core: false,
  is_realizatsiya: false,
  is_konsignatsiya: false,
  additional_parameters: {},
  status,
  is_published: isPublished,
}
```

#### List and navigation
- `ProductsPage.tsx` uses `CustomTable` with server-side pagination and search.
- “Create Product” button navigates to `/products/catalog/create`.
- Deletes use `ConfirmModal` and `productsService.remove` then invalidate `['products']`.

### Notes & best practices
- Validation & errors: server-side validation is authoritative; client mirrors basic checks to improve UX.
- Performance: pagination on list endpoint; avoid fetching large datasets.
- Tenancy: always send `X-Tenant-ID` header (ObjectID hex) or rely on middleware/subdomain resolution.
- Extensibility: add new fields by
  - Updating `models.Product`, `ProductCreate`, `ProductUpdate`, `ToProductDTO`
  - Mapping in `ProductService` (validation and update logic)
  - Extending `productsService` types and the create/edit pages
- Testing (recommended)
  - Unit test service and repository with `testify` and mocked mongo client
  - Avoid testing implementation details; cover SKU uniqueness, relation validation, and defaults
- API docs
  - Keep endpoint contracts in sync with Swagger; example payloads above can be mirrored into OpenAPI schemas. 