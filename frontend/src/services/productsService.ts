import { apiClient } from './base/apiClient'

export type ProductDimensions = {
  length: number
  width: number
  height: number
  unit: string
}

export type ProductAttribute = {
  name: string
  value: string
}

export type ProductVariant = {
  id?: string
  name: string
  sku: string
  price: number
  cost_price: number
  stock: number
  barcode: string
  images: string[]
  attributes: ProductAttribute[]
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ProductWarehouse = {
  warehouse_id: string
  stock: number
  min_stock: number
  max_stock: number
  location: string
}

export type ProductCatalogAttribute = {
  attribute_id: string
  value: string
}

export type ProductCatalogCharacteristic = {
  characteristic_id: string
  value: string
}

export type ProductCatalogParameter = {
  parameter_id: string
  value: any
}

export type BundleItem = {
  product_id: string
  quantity: number
  price?: number
}

export type Product = {
  id: string
  tenant_id: string
  name: string
  sku: string
  part_number?: string
  description: string
  price: number
  cost_price: number
  stock: number
  min_stock: number
  max_stock: number
  unit: string
  weight: number
  dimensions: ProductDimensions
  category_id?: string
  category_name?: string
  brand_id?: string
  brand_name?: string
  supplier_id?: string
  supplier_name?: string
  company_id?: string
  store_id?: string
  images: string[]
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  warehouses: ProductWarehouse[]

  // Catalog management relationships
  catalog_attributes?: ProductCatalogAttribute[]
  catalog_characteristics?: ProductCatalogCharacteristic[]
  catalog_parameters?: ProductCatalogParameter[]

  // Bundle fields
  type: string
  is_bundle: boolean
  bundle_price?: number
  bundle_items?: BundleItem[]

  barcode: string
  expiration_date?: string
  is_dirty_core: boolean
  is_realizatsiya: boolean
  is_konsignatsiya: boolean
  konsignatsiya_date?: string
  additional_parameters?: { [key: string]: any }
  status: string
  is_published: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductStats = { all: number; active: number; inactive: number; low: number; zero: number }
export type ProductSummary = { titles: number; units: number; supply: number; retail: number }

export type Paginated<T> = { items: T[]; total: number }

export const productsService = {
  list: (params: { 
    page?: number
    limit?: number
    search?: string
    category_id?: string
    brand_id?: string
    supplier_id?: string
    status?: string
    is_active?: boolean
    is_bundle?: boolean
    min_price?: number
    max_price?: number
    store_id?: string
    // prefer low_stock flag; keep min_stock for backward-compat but do not send it here
    low_stock?: boolean
    zero_stock?: boolean
    archived?: boolean
    is_realizatsiya?: boolean
    is_konsignatsiya?: boolean
    is_dirty_core?: boolean
  }) =>
    apiClient.get<{ data: Paginated<Product> }>(`/api/products`, { params }).then(r => r.data.data),
  
  get: (id: string) =>
    apiClient.get<{ data: Product }>(`/api/products/${id}`).then(r => r.data.data),
  
  create: (payload: {
    name: string
    sku: string
    part_number?: string
    description: string
    price: number
    cost_price: number
    stock: number
    min_stock: number
    max_stock: number
    unit: string
    weight: number
    dimensions: ProductDimensions
    category_id?: string
    brand_id?: string
    supplier_id?: string
    company_id?: string
    store_id?: string
    images: string[]
    attributes: ProductAttribute[]
    variants: ProductVariant[]
    warehouses: ProductWarehouse[]
    catalog_attributes?: ProductCatalogAttribute[]
    catalog_characteristics?: ProductCatalogCharacteristic[]
    catalog_parameters?: ProductCatalogParameter[]
    type: string
    is_bundle: boolean
    bundle_price?: number
    bundle_items?: BundleItem[]
    barcode: string
    expiration_date?: string
    is_dirty_core: boolean
    is_realizatsiya: boolean
    is_konsignatsiya: boolean
    konsignatsiya_date?: string
    additional_parameters?: { [key: string]: any }
    status: string
    is_published: boolean
  }) =>
    apiClient.post<{ data: Product }>(`/api/products`, payload).then(r => r.data.data),
  
  update: (id: string, payload: Partial<{
    name: string
    sku: string
    part_number: string
    description: string
    price: number
    cost_price: number
    stock: number
    min_stock: number
    max_stock: number
    unit: string
    weight: number
    dimensions: ProductDimensions
    category_id: string
    brand_id: string
    supplier_id: string
    company_id: string
    store_id: string
    images: string[]
    attributes: ProductAttribute[]
    variants: ProductVariant[]
    warehouses: ProductWarehouse[]
    catalog_attributes: ProductCatalogAttribute[]
    catalog_characteristics: ProductCatalogCharacteristic[]
    catalog_parameters: ProductCatalogParameter[]
    type: string
    is_bundle: boolean
    bundle_price: number
    bundle_items: BundleItem[]
    barcode: string
    expiration_date: string
    is_dirty_core: boolean
    is_realizatsiya: boolean
    is_konsignatsiya: boolean
    konsignatsiya_date: string
    additional_parameters: { [key: string]: any }
    status: string
    is_published: boolean
    is_active: boolean
  }>) =>
    apiClient.patch<{ data: Product }>(`/api/products/${id}`, payload).then(r => r.data.data),
  
  remove: (id: string) =>
    apiClient.delete(`/api/products/${id}`).then(r => r.data),

  updateStock: (id: string, stock: number) =>
    apiClient.patch(`/api/products/${id}/stock`, { stock }).then(r => r.data),

  bulkDelete: (ids: string[]) =>
    apiClient.post(`/api/products/bulk/delete`, { ids }).then(r => r.data),

  bulkEditProperties: (ids: string[], props: { brand_id?: string|null; category_id?: string|null; expiration_date?: string|null }) =>
    apiClient.post(`/api/products/bulk/edit-properties`, { ids, props }).then(r => r.data),

  bulkArchive: (ids: string[]) =>
    apiClient.post(`/api/products/bulk/archive`, { ids }).then(r => r.data),

  bulkUnarchive: (ids: string[]) =>
    apiClient.post(`/api/products/bulk/unarchive`, { ids }).then(r => r.data),

  stats: (params: { store_id?: string }) =>
    apiClient.get<{ data: ProductStats }>(`/api/products/stats`, { params }).then(r => r.data.data),

  summary: (params: { store_id?: string }) =>
    apiClient.get<{ data: ProductSummary }>(`/api/products/summary`, { params }).then(r => r.data.data),
} 