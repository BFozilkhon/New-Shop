package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Role struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name"`
	Key       string             `bson:"key"`
	Description string           `bson:"description,omitempty"`
	Permissions []string         `bson:"permissions,omitempty"`
	IsActive  bool               `bson:"is_active"`
	IsDeleted bool               `bson:"is_deleted"`
	CreatedAt time.Time          `bson:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"`
}

type RoleDTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Key       string    `json:"key"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
	IsActive  bool      `json:"is_active"`
	IsDeleted bool      `json:"is_deleted"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToRoleDTO(m Role) RoleDTO { return RoleDTO{ID: m.ID.Hex(), Name: m.Name, Key: m.Key, Description: m.Description, Permissions: m.Permissions, IsActive: m.IsActive, IsDeleted: m.IsDeleted, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt} }

type RoleCreate struct { Name string `json:"name"` ; Key string `json:"key"` ; Description string `json:"description"` ; Permissions []string `json:"permissions"` }

type RoleUpdate struct { Name *string `json:"name"` ; Key *string `json:"key"` ; Description *string `json:"description"` ; Permissions *[]string `json:"permissions"` ; IsActive *bool `json:"is_active"` } 