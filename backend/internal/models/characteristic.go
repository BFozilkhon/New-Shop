package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	CharacteristicTypeText   = "text"
	CharacteristicTypeNumber = "number"
	CharacteristicTypeSelect = "select"
	CharacteristicTypeBool   = "boolean"
)

type Characteristic struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Type      string             `bson:"type"`
	IsActive  bool               `bson:"is_active"`
	IsDeleted bool               `bson:"is_deleted"`
	CreatedAt time.Time          `bson:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"`
}

type CharacteristicDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	IsActive  bool      `json:"is_active"`
	IsDeleted bool      `json:"is_deleted"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CharacteristicCreate struct {
	Name string `json:"name"`
	Type string `json:"type,omitempty"`
}

type CharacteristicUpdate struct {
	Name     *string `json:"name"`
	Type     *string `json:"type"`
	IsActive *bool   `json:"is_active"`
}

func ToCharacteristicDTO(m Characteristic) CharacteristicDTO {
	return CharacteristicDTO{
		ID:        m.ID.Hex(),
		Name:      m.Name,
		Type:      m.Type,
		IsActive:  m.IsActive,
		IsDeleted: m.IsDeleted,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
} 