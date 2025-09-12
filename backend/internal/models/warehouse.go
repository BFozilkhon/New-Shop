package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	WarehouseTypeMain      = "main"
	WarehouseTypeStore     = "store"
	WarehouseTypeWarehouse = "warehouse"
)

type Warehouse struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`
	Name      string             `bson:"name" json:"name" binding:"required"`
	Address   string             `bson:"address" json:"address"`
	Type      string             `bson:"type" json:"type"` // main, store, warehouse
	IsActive  bool               `bson:"is_active" json:"is_active"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type WarehouseDTO struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Type      string    `json:"type"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type WarehouseCreate struct {
	Name    string `json:"name" binding:"required"`
	Address string `json:"address"`
	Type    string `json:"type"`
}

type WarehouseUpdate struct {
	Name     *string `json:"name"`
	Address  *string `json:"address"`
	Type     *string `json:"type"`
	IsActive *bool   `json:"is_active"`
}

func ToWarehouseDTO(m Warehouse) WarehouseDTO {
	return WarehouseDTO{
		ID:        m.ID.Hex(),
		TenantID:  m.TenantID,
		Name:      m.Name,
		Address:   m.Address,
		Type:      m.Type,
		IsActive:  m.IsActive,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
} 