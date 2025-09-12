package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Attribute struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Value     string             `bson:"value"`
	IsActive  bool               `bson:"is_active"`
	IsDeleted bool               `bson:"is_deleted"`
	CreatedAt time.Time          `bson:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"`
}

type AttributeDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Value     string    `json:"value"`
	IsActive  bool      `json:"is_active"`
	IsDeleted bool      `json:"is_deleted"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AttributeCreate struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type AttributeUpdate struct {
	Name     *string `json:"name"`
	Value    *string `json:"value"`
	IsActive *bool   `json:"is_active"`
}

func ToAttributeDTO(m Attribute) AttributeDTO {
	return AttributeDTO{
		ID:        m.ID.Hex(),
		Name:      m.Name,
		Value:     m.Value,
		IsActive:  m.IsActive,
		IsDeleted: m.IsDeleted,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
} 