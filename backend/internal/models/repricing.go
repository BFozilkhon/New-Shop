package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Repricing document: adjust prices for products in a store
// Status: NEW | APPROVED | REJECTED

type Repricing struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`

	ExternalID int64  `bson:"external_id" json:"external_id"`
	Name       string `bson:"name" json:"name"`

	ShopID   string `bson:"shop_id" json:"shop_id"`
	ShopName string `bson:"shop_name" json:"shop_name"`

	FromFile bool   `bson:"from_file" json:"from_file"`
	Type     string `bson:"type" json:"type"` // price_change | currency_change | delivery_price_change

	Status string `bson:"status" json:"status"`

	TotalItemsCount int       `bson:"total_items_count" json:"total_items_count"`
	Total           float64   `bson:"total" json:"total"`
	CreatedAt       time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time `bson:"updated_at" json:"updated_at"`
	FinishedAt      *time.Time `bson:"finished_at,omitempty" json:"finished_at,omitempty"`

	CreatedBy InventoryUser `bson:"created_by" json:"created_by"`
	FinishedBy InventoryUser `bson:"finished_by" json:"finished_by"`

	Items []RepricingItem `bson:"items" json:"items"`
}

type RepricingItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	ProductName string             `bson:"product_name" json:"product_name"`
	ProductSKU  string             `bson:"product_sku" json:"product_sku"`
	Barcode     string             `bson:"barcode" json:"barcode"`
	Currency    string             `bson:"currency" json:"currency"`
	SupplyPrice float64            `bson:"supply_price" json:"supply_price"`
	RetailPrice float64            `bson:"retail_price" json:"retail_price"`
	Qty         float64            `bson:"qty" json:"qty"`
}

type CreateRepricingRequest struct {
	Name     string `json:"name"`
	FromFile bool   `json:"from_file"`
	ShopID   string `json:"shop_id"`
	Type     string `json:"type"`
}

type RepricingItemInput struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	ProductSKU  string  `json:"product_sku"`
	Barcode     string  `json:"barcode"`
	Currency    string  `json:"currency"`
	SupplyPrice float64 `json:"supply_price"`
	RetailPrice float64 `json:"retail_price"`
	Qty         float64 `json:"qty"`
}

type UpdateRepricingRequest struct {
	Name  string                `json:"name"`
	Items []RepricingItemInput  `json:"items"`
	Action string              `json:"action"` // approve | reject | ""
} 