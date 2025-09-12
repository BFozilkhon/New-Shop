package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Brand struct {
	ID           primitive.ObjectID       `bson:"_id,omitempty" json:"id"`
	TenantID     string                   `bson:"tenant_id" json:"tenant_id"`
	Name         string                   `bson:"name" json:"name" binding:"required"`
	Description  string                   `bson:"description" json:"description"`
	Logo         string                   `bson:"logo" json:"logo"`
	Images       []map[string]interface{} `bson:"images" json:"images"`
	Website      string                   `bson:"website" json:"website"`
	IsActive     bool                     `bson:"is_active" json:"is_active"`
	ProductCount int                      `bson:"product_count" json:"product_count"`
	CreatedAt    time.Time                `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time                `bson:"updated_at" json:"updated_at"`
}

type BrandDTO struct {
	ID           string                   `json:"id"`
	TenantID     string                   `json:"tenant_id"`
	Name         string                   `json:"name"`
	Description  string                   `json:"description"`
	Logo         string                   `json:"logo"`
	Images       []map[string]interface{} `json:"images"`
	Website      string                   `json:"website"`
	IsActive     bool                     `json:"is_active"`
	ProductCount int                      `json:"product_count"`
	CreatedAt    time.Time                `json:"created_at"`
	UpdatedAt    time.Time                `json:"updated_at"`
}

type BrandCreate struct {
	Name        string                   `json:"name" binding:"required"`
	Description string                   `json:"description"`
	Logo        string                   `json:"logo"`
	Images      []map[string]interface{} `json:"images"`
	Website     string                   `json:"website"`
}

type BrandUpdate struct {
	Name        *string                   `json:"name"`
	Description *string                   `json:"description"`
	Logo        *string                   `json:"logo"`
	Images      []map[string]interface{}  `json:"images"`
	Website     *string                   `json:"website"`
	IsActive    *bool                     `json:"is_active"`
}

func ToBrandDTO(m Brand) BrandDTO {
	return BrandDTO{
		ID:           m.ID.Hex(),
		TenantID:     m.TenantID,
		Name:         m.Name,
		Description:  m.Description,
		Logo:         m.Logo,
		Images:       m.Images,
		Website:      m.Website,
		IsActive:     m.IsActive,
		ProductCount: m.ProductCount,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
} 