package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Attribute struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Values    []string           `bson:"values"`
	IsActive  bool               `bson:"is_active"`
	IsDeleted bool               `bson:"is_deleted"`
	CreatedAt time.Time          `bson:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"`
}

type AttributeDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Values    []string  `json:"values"`
	IsActive  bool      `json:"is_active"`
	IsDeleted bool      `json:"is_deleted"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AttributeCreate struct {
	Name   string   `json:"name"`
	Values []string `json:"values"`
}

type AttributeUpdate struct {
	Name     *string  `json:"name"`
	Values   []string `json:"values"`
	IsActive *bool    `json:"is_active"`
}

func ToAttributeDTO(m Attribute) AttributeDTO {
	return AttributeDTO{
		ID:        m.ID.Hex(),
		Name:      m.Name,
		Values:    m.Values,
		IsActive:  m.IsActive,
		IsDeleted: m.IsDeleted,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
} 