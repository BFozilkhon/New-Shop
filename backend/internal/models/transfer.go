package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Transfer represents a stock movement between stores
// When approved, it logically moves quantities from a departure store to an arrival store

type Transfer struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`

	ExternalID int64  `bson:"external_id" json:"external_id"`
	Name       string `bson:"name" json:"name"`

	DepartureShopID   string `bson:"departure_shop_id" json:"departure_shop_id"`
	DepartureShopName string `bson:"departure_shop_name" json:"departure_shop_name"`
	ArrivalShopID     string `bson:"arrival_shop_id" json:"arrival_shop_id"`
	ArrivalShopName   string `bson:"arrival_shop_name" json:"arrival_shop_name"`

	FromFile bool   `bson:"from_file" json:"from_file"`
	Status   string `bson:"status" json:"status"` // NEW | APPROVED | REJECTED

	TotalQty   float64   `bson:"total_qty" json:"total_qty"`
	TotalPrice float64   `bson:"total_price" json:"total_price"` // by retail price
	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time `bson:"updated_at" json:"updated_at"`
	FinishedAt *time.Time `bson:"finished_at,omitempty" json:"finished_at,omitempty"`

	CreatedBy  InventoryUser `bson:"created_by" json:"created_by"`
	FinishedBy InventoryUser `bson:"finished_by" json:"finished_by"`

	Items []TransferItem `bson:"items" json:"items"`
}

type TransferItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	ProductName string             `bson:"product_name" json:"product_name"`
	ProductSKU  string             `bson:"product_sku" json:"product_sku"`
	Barcode     string             `bson:"barcode" json:"barcode"`
	Qty         float64            `bson:"qty" json:"qty"`
	Unit        string             `bson:"unit" json:"unit"`
	SupplyPrice float64            `bson:"supply_price" json:"supply_price"`
	RetailPrice float64            `bson:"retail_price" json:"retail_price"`
}

type TransferItemInput struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	ProductSKU  string  `json:"product_sku"`
	Barcode     string  `json:"barcode"`
	Qty         float64 `json:"qty"`
	Unit        string  `json:"unit"`
	SupplyPrice float64 `json:"supply_price"`
	RetailPrice float64 `json:"retail_price"`
}

type TransferFilterRequest struct {
	Search          string `json:"search"`
	DepartureShopID string `json:"departure_shop_id"`
	ArrivalShopID   string `json:"arrival_shop_id"`
	Status          string `json:"status"`
	DateFrom        string `json:"date_from"`
	DateTo          string `json:"date_to"`
	Page            int    `json:"page"`
	Limit           int    `json:"limit"`
	SortBy          string `json:"sort_by"`
	SortOrder       string `json:"sort_order"`
}

type CreateTransferRequest struct {
	Name             string `json:"name"`
	FromFile         bool   `json:"from_file"`
	DepartureShopID  string `json:"departure_shop_id"`
	ArrivalShopID    string `json:"arrival_shop_id"`
}

type UpdateTransferRequest struct {
	Name   string               `json:"name"`
	Items  []TransferItemInput  `json:"items"`
	Action string               `json:"action"` // approve | reject | ""
} 