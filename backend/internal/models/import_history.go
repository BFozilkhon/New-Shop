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
	FileName    string             `bson:"file_name"`
	StoreID     primitive.ObjectID `bson:"store_id,omitempty"`
	StoreName   string             `bson:"store_name,omitempty"`
	TotalRows   int                `bson:"total_rows"`
	SuccessRows int                `bson:"success_rows"`
	ErrorRows   int                `bson:"error_rows"`
	Status      string             `bson:"status"`
	CreatedAt   time.Time          `bson:"created_at"`
}

type ImportHistoryDTO struct {
	ID          string    `json:"id"`
	FileName    string    `json:"file_name"`
	StoreID     string    `json:"store_id"`
	StoreName   string    `json:"store_name"`
	TotalRows   int       `json:"total_rows"`
	SuccessRows int       `json:"success_rows"`
	ErrorRows   int       `json:"error_rows"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

func ToImportHistoryDTO(m ImportHistory) ImportHistoryDTO {
	return ImportHistoryDTO{
		ID: m.ID.Hex(), FileName: m.FileName,
		StoreID: m.StoreID.Hex(), StoreName: m.StoreName,
		TotalRows: m.TotalRows, SuccessRows: m.SuccessRows, ErrorRows: m.ErrorRows,
		Status: m.Status, CreatedAt: m.CreatedAt,
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
} 