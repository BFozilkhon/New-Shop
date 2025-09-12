package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// WriteOff represents a stock deduction document
// Used when products are written off due to defect, expiration, loss, etc.

type WriteOff struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`

	ExternalID int64  `bson:"external_id" json:"external_id"`
	Name       string `bson:"name" json:"name"`

	ShopID   string `bson:"shop_id" json:"shop_id"`
	ShopName string `bson:"shop_name" json:"shop_name"`

	ReasonID   string `bson:"reason_id" json:"reason_id"`
	ReasonName string `bson:"reason_name" json:"reason_name"`
	FromFile   bool   `bson:"from_file" json:"from_file"`

	Status string `bson:"status" json:"status"` // NEW | APPROVED | REJECTED

	TotalQty         float64   `bson:"total_qty" json:"total_qty"`
	TotalSupplyPrice float64   `bson:"total_supply_price" json:"total_supply_price"`
	TotalRetailPrice float64   `bson:"total_retail_price" json:"total_retail_price"`
	CreatedAt        time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time `bson:"updated_at" json:"updated_at"`
	FinishedAt       *time.Time `bson:"finished_at,omitempty" json:"finished_at,omitempty"`

	CreatedBy InventoryUser `bson:"created_by" json:"created_by"`
	FinishedBy InventoryUser `bson:"finished_by" json:"finished_by"`

	Items []WriteOffItem `bson:"items" json:"items"`
}

type WriteOffItem struct {
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

type WriteOffItemInput struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	ProductSKU  string  `json:"product_sku"`
	Barcode     string  `json:"barcode"`
	Qty         float64 `json:"qty"`
	Unit        string  `json:"unit"`
	SupplyPrice float64 `json:"supply_price"`
	RetailPrice float64 `json:"retail_price"`
}

type WriteOffFilterRequest struct {
	Search   string `json:"search"`
	ShopID   string `json:"shop_id"`
	Status   string `json:"status"`
	DateFrom string `json:"date_from"`
	DateTo   string `json:"date_to"`
	Page     int    `json:"page"`
	Limit    int    `json:"limit"`
	SortBy   string `json:"sort_by"`
	SortOrder string `json:"sort_order"`
}

type CreateWriteOffRequest struct {
	Name     string `json:"name"`
	FromFile bool   `json:"from_file"`
	ShopID   string `json:"shop_id"`
	Reason   string `json:"reason"`
}

type UpdateWriteOffRequest struct {
	Name   string              `json:"name"`
	Items  []WriteOffItemInput `json:"items"`
	Action string              `json:"action"` // approve | reject | ""
} 