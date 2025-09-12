package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Inventory main model
// Mirrors the provided schema while aligning JSON usage with string ids for payloads

type Inventory struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`

	ExternalID int64   `bson:"external_id" json:"external_id"`
	Name       string  `bson:"name" json:"name"`
	ShopID     string  `bson:"shop_id" json:"shop_id"`
	ShopName   string  `bson:"shop_name" json:"shop_name"`

	TotalMeasurementValue float64 `bson:"total_measurement_value" json:"total_measurement_value"`
	NewProducts           int     `bson:"new_products" json:"new_products"`
	Shortage              int     `bson:"shortage" json:"shortage"`
	Postponed             int     `bson:"postponed" json:"postponed"`
	Surplus               int     `bson:"surplus" json:"surplus"`
	DifferenceSum         float64 `bson:"difference_sum" json:"difference_sum"`

	Type      string `bson:"type" json:"type"` // FULL | PARTIAL
	TypeID    string `bson:"type_id" json:"type_id"`
	StatusID  string `bson:"status_id" json:"status_id"`
	ProcessPct int    `bson:"process_percentage" json:"process_percentage"`

	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time `bson:"updated_at" json:"updated_at"`
	FinishedAt *time.Time `bson:"finished_at,omitempty" json:"finished_at,omitempty"`

	CreatedBy InventoryUser `bson:"created_by" json:"created_by"`
	FinishedBy InventoryUser `bson:"finished_by" json:"finished_by"`

	ImportID  string `bson:"import_id" json:"import_id"`
	TransferID string `bson:"transfer_id" json:"transfer_id"`

	UseDeparturePrice   bool `bson:"use_departure_price" json:"use_departure_price"`
	UseOldPrices        bool `bson:"use_old_prices" json:"use_old_prices"`
	UseImportProperties bool `bson:"use_import_properties" json:"use_import_properties"`

	OrderID   string `bson:"order_id" json:"order_id"`
	Locked    bool   `bson:"locked" json:"locked"`
	Deleted   bool   `bson:"deleted" json:"deleted"`
	CompanyID string `bson:"company_id" json:"company_id"`

	Items       []InventoryItem `bson:"items" json:"items"`
	ProcessID   string          `bson:"process_id" json:"process_id"`
	ProcessType int             `bson:"process_type" json:"process_type"`
}

type InventoryUser struct {
	ID   string `bson:"id" json:"id"`
	Name string `bson:"name" json:"name"`
}

type InventoryItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	ProductName string             `bson:"product_name" json:"product_name"`
	ProductSKU  string             `bson:"product_sku" json:"product_sku"`
	Barcode     string             `bson:"barcode" json:"barcode"`
	Declared    float64            `bson:"declared" json:"declared"`
	Scanned     float64            `bson:"scanned" json:"scanned"`
	Unit        string             `bson:"unit" json:"unit"`
	Price       float64            `bson:"price" json:"price"`
	CostPrice   float64            `bson:"cost_price" json:"cost_price"`
}

// Input-friendly item for create/update

type InventoryItemInput struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	ProductSKU  string  `json:"product_sku"`
	Barcode     string  `json:"barcode"`
	Declared    float64 `json:"declared"`
	Scanned     float64 `json:"scanned"`
	Unit        string  `json:"unit"`
	Price       float64 `json:"price"`
	CostPrice   float64 `json:"cost_price"`
}

type InventoryFilterRequest struct {
	Search    string `json:"search"`
	ShopID    string `json:"shop_id"`
	StatusID  string `json:"status_id"`
	Type      string `json:"type"`
	DateFrom  string `json:"date_from"`
	DateTo    string `json:"date_to"`
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	SortBy    string `json:"sort_by"`
	SortOrder string `json:"sort_order"`
}

type CreateInventoryRequest struct {
	Name   string `json:"name"`
	ShopID string `json:"shop_id"`
	Type   string `json:"type"`
}

type UpdateInventoryRequest struct {
	Name      string               `json:"name"`
	StatusID  string               `json:"status_id"`
	Items     []InventoryItemInput `json:"items"`
	Finished  bool                 `json:"finished"`
} 