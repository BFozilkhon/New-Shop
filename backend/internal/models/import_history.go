package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ImportHistory represents a record of a bulk product import operation
// It is tenant-scoped
type ImportHistory struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	TenantID    primitive.ObjectID `bson:"tenant_id"`
	UserID      primitive.ObjectID `bson:"user_id,omitempty"`
	ExternalID  int64              `bson:"external_id"`
	FileName    string             `bson:"file_name"`
	StoreID     primitive.ObjectID `bson:"store_id,omitempty"`
	StoreName   string             `bson:"store_name,omitempty"`
	TotalRows   int                `bson:"total_rows"`
	SuccessRows int                `bson:"success_rows"`
	ErrorRows   int                `bson:"error_rows"`
	Status      string             `bson:"status"`
	ImportType  string             `bson:"import_type"` // EXPORT | INVENTORY_SURPLUS | PRODUCT_CREATION
	Items       []ImportHistoryItem `bson:"items"`
	CreatedAt   time.Time          `bson:"created_at"`
}

type ImportHistoryItem struct {
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	ProductName string             `bson:"product_name" json:"product_name"`
	ProductSKU  string             `bson:"product_sku" json:"product_sku"`
	Barcode     string             `bson:"barcode" json:"barcode"`
	Qty         int                `bson:"qty" json:"qty"`
	Unit        string             `bson:"unit" json:"unit"`
}

type ImportHistoryDTO struct {
	ID          string    `json:"id"`
	ExternalID  int64     `json:"external_id"`
	FileName    string    `json:"file_name"`
	StoreID     string    `json:"store_id"`
	StoreName   string    `json:"store_name"`
	TotalRows   int       `json:"total_rows"`
	SuccessRows int       `json:"success_rows"`
	ErrorRows   int       `json:"error_rows"`
	Status      string    `json:"status"`
	ImportType  string    `json:"import_type"`
	CreatedAt   time.Time `json:"created_at"`
	Items       []ImportHistoryItem `json:"items,omitempty"`
}

func ToImportHistoryDTO(m ImportHistory) ImportHistoryDTO {
	return ImportHistoryDTO{
		ID: m.ID.Hex(), ExternalID: m.ExternalID, FileName: m.FileName,
		StoreID: m.StoreID.Hex(), StoreName: m.StoreName,
		TotalRows: m.TotalRows, SuccessRows: m.SuccessRows, ErrorRows: m.ErrorRows,
		Status: m.Status, ImportType: m.ImportType, CreatedAt: m.CreatedAt,
		Items: m.Items,
	}
}

type CreateImportHistoryRequest struct {
	FileName    string `json:"file_name"`
	StoreID     string `json:"store_id"`
	StoreName   string `json:"store_name"`
	TotalRows   int    `json:"total_rows"`
	SuccessRows int    `json:"success_rows"`
	ErrorRows   int    `json:"error_rows"`
	Status      string `json:"status"`
	ImportType  string `json:"import_type"`
	Items       []ImportHistoryItemInput `json:"items"`
}

type ImportHistoryItemInput struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	ProductSKU  string `json:"product_sku"`
	Barcode     string `json:"barcode"`
	Qty         int    `json:"qty"`
	Unit        string `json:"unit"`
} 