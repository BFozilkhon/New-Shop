package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Category struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty"`
	Name        string              `bson:"name"`
	ParentID    *primitive.ObjectID `bson:"parent_id,omitempty"`
	Level       int                 `bson:"level"` // 0=root, 1=sub, 2=sub-sub, ... unlimited
	Image       string              `bson:"image,omitempty"`
	IsActive    bool                `bson:"is_active"`
	IsDeleted   bool                `bson:"is_deleted"`
	CreatedAt   time.Time           `bson:"created_at"`
	UpdatedAt   time.Time           `bson:"updated_at"`
}

type CategoryDTO struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	ParentID     *string       `json:"parent_id,omitempty"`
	Level        int           `json:"level"`
	IsActive     bool          `json:"is_active"`
	IsDeleted    bool          `json:"is_deleted"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
	ProductCount int64         `json:"product_count,omitempty"`
	Children     []CategoryDTO `json:"children,omitempty"`
}

type CategoryCreate struct {
	Name     string  `json:"name"`
	ParentID *string `json:"parent_id,omitempty"`
}

type CategoryUpdate struct {
	Name     *string `json:"name"`
	ParentID *string `json:"parent_id,omitempty"`
	IsActive *bool   `json:"is_active"`
}

func ToCategoryDTO(m Category) CategoryDTO {
	dto := CategoryDTO{
		ID:        m.ID.Hex(),
		Name:      m.Name,
		Level:     m.Level,
		IsActive:  m.IsActive,
		IsDeleted: m.IsDeleted,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	if m.ParentID != nil {
		pid := m.ParentID.Hex()
		dto.ParentID = &pid
	}
	return dto
} 