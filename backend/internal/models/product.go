package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Product main model
type Product struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID    string             `bson:"tenant_id" json:"tenant_id"`
	Name        string             `bson:"name" json:"name" binding:"required"`
	SKU         string             `bson:"sku" json:"sku" binding:"required"`
	PartNumber  string             `bson:"part_number,omitempty" json:"part_number,omitempty"`
	Description string             `bson:"description" json:"description"`
	Price       float64            `bson:"price" json:"price" binding:"required,min=0"`
	CostPrice   float64            `bson:"cost_price" json:"cost_price" binding:"min=0"`
	Stock       int                `bson:"stock" json:"stock" binding:"min=0"`
	MinStock    int                `bson:"min_stock" json:"min_stock"`
	MaxStock    int                `bson:"max_stock" json:"max_stock"`
	Unit        string             `bson:"unit" json:"unit"`
	Weight      float64            `bson:"weight" json:"weight"`
	Dimensions  ProductDimensions  `bson:"dimensions" json:"dimensions"`
	CategoryID  primitive.ObjectID `bson:"category_id,omitempty" json:"category_id"`
	CategoryIDs []primitive.ObjectID `bson:"category_ids,omitempty" json:"category_ids,omitempty"`
	BrandID     primitive.ObjectID `bson:"brand_id,omitempty" json:"brand_id"`
	SupplierID  primitive.ObjectID `bson:"supplier_id,omitempty" json:"supplier_id"`
	// New relationships (optional)
	CompanyID   primitive.ObjectID `bson:"company_id,omitempty" json:"company_id"`
	StoreID     primitive.ObjectID `bson:"store_id,omitempty" json:"store_id"`
	Images      []string           `bson:"images" json:"images"`
	Attributes  []ProductAttribute `bson:"attributes" json:"attributes"`
	Variants    []ProductVariant   `bson:"variants" json:"variants"`
	Warehouses  []ProductWarehouse `bson:"warehouses" json:"warehouses"`

	// Catalog management relationships
	CatalogAttributes      []ProductCatalogAttribute      `bson:"catalog_attributes,omitempty" json:"catalog_attributes,omitempty"`
	CatalogCharacteristics []ProductCatalogCharacteristic `bson:"catalog_characteristics,omitempty" json:"catalog_characteristics,omitempty"`
	CatalogParameters      []ProductCatalogParameter      `bson:"catalog_parameters,omitempty" json:"catalog_parameters,omitempty"`

	// Bundle fields
	Type        string       `bson:"type" json:"type"`                                     // single, bundle
	IsBundle    bool         `bson:"is_bundle" json:"is_bundle"`                           // true if bundle
	BundlePrice *float64     `bson:"bundle_price,omitempty" json:"bundle_price,omitempty"` // bundle price if different from sum
	BundleItems []BundleItem `bson:"bundle_items,omitempty" json:"bundle_items,omitempty"` // bundle elements

	Barcode              string                 `bson:"barcode" json:"barcode"`
	ExpirationDate       *time.Time             `bson:"expiration_date,omitempty" json:"expiration_date,omitempty"`
	IsDirtyCore          bool                   `bson:"is_dirty_core" json:"is_dirty_core"`
	IsRealizatsiya       bool                   `bson:"is_realizatsiya" json:"is_realizatsiya"`
	IsKonsignatsiya      bool                   `bson:"is_konsignatsiya" json:"is_konsignatsiya"`
	KonsignatsiyaDate    *time.Time             `bson:"konsignatsiya_date,omitempty" json:"konsignatsiya_date,omitempty"`
	AdditionalParameters map[string]interface{} `bson:"additional_parameters,omitempty" json:"additional_parameters,omitempty"`
	Status               string                 `bson:"status" json:"status"` // active, inactive
	IsPublished          bool                   `bson:"is_published" json:"is_published"`
	IsActive             bool                   `bson:"is_active" json:"is_active"`

	Archived   bool        `bson:"archived" json:"archived"`
	ArchivedAt *time.Time  `bson:"archived_at,omitempty" json:"archived_at,omitempty"`

	CreatedAt            time.Time              `bson:"created_at" json:"created_at"`
	UpdatedAt            time.Time              `bson:"updated_at" json:"updated_at"`
}

// Embedded structs
type ProductDimensions struct {
	Length float64 `bson:"length" json:"length"`
	Width  float64 `bson:"width" json:"width"`
	Height float64 `bson:"height" json:"height"`
	Unit   string  `bson:"unit" json:"unit"` // cm, mm, m, in
}

type ProductAttribute struct {
	Name  string `bson:"name" json:"name"`
	Value string `bson:"value" json:"value"`
}

type ProductVariant struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	SKU         string             `bson:"sku" json:"sku"`
	Price       float64            `bson:"price" json:"price"`
	CostPrice   float64            `bson:"cost_price" json:"cost_price"`
	Stock       int                `bson:"stock" json:"stock"`
	Barcode     string             `bson:"barcode" json:"barcode"`
	Images      []string           `bson:"images" json:"images"`
	Attributes  []ProductAttribute `bson:"attributes" json:"attributes"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type ProductWarehouse struct {
	WarehouseID primitive.ObjectID `bson:"warehouse_id" json:"warehouse_id"`
	Stock       int                `bson:"stock" json:"stock"`
	MinStock    int                `bson:"min_stock" json:"min_stock"`
	MaxStock    int                `bson:"max_stock" json:"max_stock"`
	Location    string             `bson:"location" json:"location"` // shelf, zone, etc.
}

// Catalog management relationships
type ProductCatalogAttribute struct {
	AttributeID primitive.ObjectID `bson:"attribute_id" json:"attribute_id"`
	Value       string             `bson:"value" json:"value"`
}

type ProductCatalogCharacteristic struct {
	CharacteristicID primitive.ObjectID `bson:"characteristic_id" json:"characteristic_id"`
	Value            string             `bson:"value" json:"value"`
}

type ProductCatalogParameter struct {
	ParameterID primitive.ObjectID `bson:"parameter_id" json:"parameter_id"`
	Value       interface{}        `bson:"value" json:"value"`
}

// Bundle items
type BundleItem struct {
	ProductID primitive.ObjectID `bson:"product_id" json:"product_id"`
	Quantity  int                `bson:"quantity" json:"quantity"`
	Price     *float64           `bson:"price,omitempty" json:"price,omitempty"` // override price if needed
}

// Product status constants
const (
	ProductStatusActive   = "active"
	ProductStatusInactive = "inactive"
	ProductTypeSingle     = "single"
	ProductTypeBundle     = "bundle"
)

// DTO structs
type ProductDTO struct {
	ID          string             `json:"id"`
	TenantID    string             `json:"tenant_id"`
	Name        string             `json:"name"`
	SKU         string             `json:"sku"`
	PartNumber  string             `json:"part_number,omitempty"`
	Description string             `json:"description"`
	Price       float64            `json:"price"`
	CostPrice   float64            `json:"cost_price"`
	Stock       int                `json:"stock"`
	MinStock    int                `json:"min_stock"`
	MaxStock    int                `json:"max_stock"`
	Unit        string             `json:"unit"`
	Weight      float64            `json:"weight"`
	Dimensions  ProductDimensions  `json:"dimensions"`
	CategoryID  string             `json:"category_id,omitempty"`
	CategoryIDs []string           `json:"category_ids,omitempty"`
	CategoryName string            `json:"category_name,omitempty"`
    CategoryNames []string       `json:"category_names,omitempty"`
	BrandID     string             `json:"brand_id,omitempty"`
	BrandName   string             `json:"brand_name,omitempty"`
	SupplierID  string             `json:"supplier_id,omitempty"`
	SupplierName string            `json:"supplier_name,omitempty"`
	CompanyID   string             `json:"company_id,omitempty"`
	StoreID     string             `json:"store_id,omitempty"`
	Images      []string           `json:"images"`
	Attributes  []ProductAttribute `json:"attributes"`
	Variants    []ProductVariant   `json:"variants"`
	Warehouses  []ProductWarehouse `json:"warehouses"`

	// Catalog management relationships
	CatalogAttributes      []ProductCatalogAttribute      `json:"catalog_attributes,omitempty"`
	CatalogCharacteristics []ProductCatalogCharacteristic `json:"catalog_characteristics,omitempty"`
	CatalogParameters      []ProductCatalogParameter      `json:"catalog_parameters,omitempty"`

	// Bundle fields
	Type        string       `json:"type"`
	IsBundle    bool         `json:"is_bundle"`
	BundlePrice *float64     `json:"bundle_price,omitempty"`
	BundleItems []BundleItem `json:"bundle_items,omitempty"`

	Barcode              string                 `json:"barcode"`
	ExpirationDate       *time.Time             `json:"expiration_date,omitempty"`
	IsDirtyCore          bool                   `json:"is_dirty_core"`
	IsRealizatsiya       bool                   `json:"is_realizatsiya"`
	IsKonsignatsiya      bool                   `json:"is_konsignatsiya"`
	KonsignatsiyaDate    *time.Time             `json:"konsignatsiya_date,omitempty"`
	AdditionalParameters map[string]interface{} `json:"additional_parameters,omitempty"`
	Status               string                 `json:"status"`
	IsPublished          bool                   `json:"is_published"`
	IsActive             bool                   `json:"is_active"`

	Archived   bool        `json:"archived"`
	ArchivedAt *time.Time  `json:"archived_at,omitempty"`

	CreatedAt            time.Time              `json:"created_at"`
	UpdatedAt            time.Time              `json:"updated_at"`
}

type ProductCreate struct {
	Name        string             `json:"name" binding:"required"`
	SKU         string             `json:"sku" binding:"required"`
	PartNumber  string             `json:"part_number,omitempty"`
	Description string             `json:"description"`
	Price       float64            `json:"price" binding:"required,min=0"`
	CostPrice   float64            `json:"cost_price" binding:"min=0"`
	Stock       int                `json:"stock" binding:"min=0"`
	MinStock    int                `json:"min_stock"`
	MaxStock    int                `json:"max_stock"`
	Unit        string             `json:"unit"`
	Weight      float64            `json:"weight"`
	Dimensions  ProductDimensions  `json:"dimensions"`
	CategoryID  string             `json:"category_id,omitempty"`
	CategoryIDs []string           `json:"category_ids,omitempty"`
	BrandID     string             `json:"brand_id,omitempty"`
	SupplierID  string             `json:"supplier_id,omitempty"`
	CompanyID   string             `json:"company_id,omitempty"`
	StoreID     string             `json:"store_id,omitempty"`
	Images      []string           `json:"images"`
	Attributes  []ProductAttribute `json:"attributes"`
	Variants    []ProductVariant   `json:"variants"`
	Warehouses  []ProductWarehouse `json:"warehouses"`

	// Catalog management relationships
	CatalogAttributes      []ProductCatalogAttribute      `json:"catalog_attributes,omitempty"`
	CatalogCharacteristics []ProductCatalogCharacteristic `json:"catalog_characteristics,omitempty"`
	CatalogParameters      []ProductCatalogParameter      `json:"catalog_parameters,omitempty"`

	// Bundle fields
	Type        string       `json:"type"`
	IsBundle    bool         `json:"is_bundle"`
	BundlePrice *float64     `json:"bundle_price,omitempty"`
	BundleItems []BundleItem `json:"bundle_items,omitempty"`

	Barcode              string                 `json:"barcode"`
	ExpirationDate       *time.Time             `json:"expiration_date,omitempty"`
	IsDirtyCore          bool                   `json:"is_dirty_core"`
	IsRealizatsiya       bool                   `json:"is_realizatsiya"`
	IsKonsignatsiya      bool                   `json:"is_konsignatsiya"`
	KonsignatsiyaDate    *time.Time             `json:"konsignatsiya_date,omitempty"`
	AdditionalParameters map[string]interface{} `json:"additional_parameters,omitempty"`
	Status               string                 `json:"status"`
	IsPublished          bool                   `json:"is_published"`
}

// Bulk create from generated variants
type VariantCreateItem struct {
    NameSuffix    string    `json:"name_suffix"`         // appended to base name
    Barcode       string    `json:"barcode"`
    Images        []string  `json:"images"`
    SupplyPrice   float64   `json:"cost_price"`
    RetailPrice   float64   `json:"price"`
}

type BulkVariantsCreate struct {
    // Base fields copied to all
    Name        string            `json:"name"`
    SKU         string            `json:"sku"`
    Description string            `json:"description"`
    Unit        string            `json:"unit"`
    BrandID     string            `json:"brand_id"`
    SupplierID  string            `json:"supplier_id"`
    CategoryID  string            `json:"category_id"`
    CategoryIDs []string          `json:"category_ids"`
    StoreID     string            `json:"store_id"`
    // Variants
    Variants    []VariantCreateItem `json:"variants"`
}

type ProductUpdate struct {
	Name        *string             `json:"name"`
	SKU         *string             `json:"sku"`
	PartNumber  *string             `json:"part_number"`
	Description *string             `json:"description"`
	Price       *float64            `json:"price"`
	CostPrice   *float64            `json:"cost_price"`
	Stock       *int                `json:"stock"`
	MinStock    *int                `json:"min_stock"`
	MaxStock    *int                `json:"max_stock"`
	Unit        *string             `json:"unit"`
	Weight      *float64            `json:"weight"`
	Dimensions  *ProductDimensions  `json:"dimensions"`
	CategoryID  *string             `json:"category_id"`
	CategoryIDs []string            `json:"category_ids"`
	BrandID     *string             `json:"brand_id"`
	SupplierID  *string             `json:"supplier_id"`
	CompanyID   *string             `json:"company_id"`
	StoreID     *string             `json:"store_id"`
	Images      []string            `json:"images"`
	Attributes  []ProductAttribute  `json:"attributes"`
	Variants    []ProductVariant    `json:"variants"`
	Warehouses  []ProductWarehouse  `json:"warehouses"`

	// Catalog management relationships
	CatalogAttributes      []ProductCatalogAttribute      `json:"catalog_attributes"`
	CatalogCharacteristics []ProductCatalogCharacteristic `json:"catalog_characteristics"`
	CatalogParameters      []ProductCatalogParameter      `json:"catalog_parameters"`

	// Bundle fields
	Type        *string      `json:"type"`
	IsBundle    *bool        `json:"is_bundle"`
	BundlePrice *float64     `json:"bundle_price"`
	BundleItems []BundleItem `json:"bundle_items"`

	Barcode              *string                `json:"barcode"`
	ExpirationDate       *time.Time             `json:"expiration_date"`
	IsDirtyCore          *bool                  `json:"is_dirty_core"`
	IsRealizatsiya       *bool                  `json:"is_realizatsiya"`
	IsKonsignatsiya      *bool                  `json:"is_konsignatsiya"`
	KonsignatsiyaDate    *time.Time             `json:"konsignatsiya_date"`
	AdditionalParameters map[string]interface{} `json:"additional_parameters"`
	Status               *string                `json:"status"`
	IsPublished          *bool                  `json:"is_published"`
	IsActive             *bool                  `json:"is_active"`
}

func ToProductDTO(m Product) ProductDTO {
	dto := ProductDTO{
		ID:          m.ID.Hex(),
		TenantID:    m.TenantID,
		Name:        m.Name,
		SKU:         m.SKU,
		PartNumber:  m.PartNumber,
		Description: m.Description,
		Price:       m.Price,
		CostPrice:   m.CostPrice,
		Stock:       m.Stock,
		MinStock:    m.MinStock,
		MaxStock:    m.MaxStock,
		Unit:        m.Unit,
		Weight:      m.Weight,
		Dimensions:  m.Dimensions,
		Images:      m.Images,
		Attributes:  m.Attributes,
		Variants:    m.Variants,
		Warehouses:  m.Warehouses,

		CatalogAttributes:      m.CatalogAttributes,
		CatalogCharacteristics: m.CatalogCharacteristics,
		CatalogParameters:      m.CatalogParameters,

		Type:        m.Type,
		IsBundle:    m.IsBundle,
		BundlePrice: m.BundlePrice,
		BundleItems: m.BundleItems,

		Barcode:              m.Barcode,
		ExpirationDate:       m.ExpirationDate,
		IsDirtyCore:          m.IsDirtyCore,
		IsRealizatsiya:       m.IsRealizatsiya,
		IsKonsignatsiya:      m.IsKonsignatsiya,
		KonsignatsiyaDate:    m.KonsignatsiyaDate,
		AdditionalParameters: m.AdditionalParameters,
		Status:               m.Status,
		IsPublished:          m.IsPublished,
		IsActive:             m.IsActive,
		CreatedAt:            m.CreatedAt,
		UpdatedAt:            m.UpdatedAt,

		Archived:   m.Archived,
		ArchivedAt: m.ArchivedAt,
	}

	if m.CategoryID != primitive.NilObjectID {
		dto.CategoryID = m.CategoryID.Hex()
	}
	if len(m.CategoryIDs) > 0 {
		ids := make([]string, 0, len(m.CategoryIDs))
		for _, cid := range m.CategoryIDs { ids = append(ids, cid.Hex()) }
		dto.CategoryIDs = ids
	}
	if m.BrandID != primitive.NilObjectID {
		dto.BrandID = m.BrandID.Hex()
	}
	if m.SupplierID != primitive.NilObjectID {
		dto.SupplierID = m.SupplierID.Hex()
	}
	if m.CompanyID != primitive.NilObjectID {
		dto.CompanyID = m.CompanyID.Hex()
	}
	if m.StoreID != primitive.NilObjectID {
		dto.StoreID = m.StoreID.Hex()
	}

	return dto
} 