package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Category struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Name        string             `bson:"name"`
	ParentID    *primitive.ObjectID `bson:"parent_id,omitempty"`
	Level       int                `bson:"level"` // 0=root, 1=sub, 2=sub-sub
	Image       string             `bson:"image,omitempty"`
	IsActive    bool               `bson:"is_active"`
	IsDeleted   bool               `bson:"is_deleted"`
	CreatedAt   time.Time          `bson:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at"`
}

type CategoryDTO struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Image       string      `json:"image,omitempty"`
	IsActive    bool        `json:"is_active"`
	IsDeleted   bool        `json:"is_deleted"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

type CategoryCreate struct {
	Name     string  `json:"name"`
	Image    string  `json:"image,omitempty"`
}

type CategoryUpdate struct {
	Name     *string `json:"name"`
	Image    *string `json:"image"`
	IsActive *bool   `json:"is_active"`
}

func ToCategoryDTO(m Category) CategoryDTO {
	dto := CategoryDTO{
		ID:        m.ID.Hex(),
		Name:      m.Name,
		Image:     m.Image,
		IsActive:  m.IsActive,
		IsDeleted: m.IsDeleted,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	return dto
} 