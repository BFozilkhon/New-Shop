package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	ParameterTypeText    = "text"
	ParameterTypeNumber  = "number"
	ParameterTypeBoolean = "boolean"
	ParameterTypeSelect  = "select"
	ParameterStatusActive   = "active"
	ParameterStatusInactive = "inactive"
)

type Parameter struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	TenantID  string             `bson:"tenant_id" json:"tenant_id"`
	Name      string             `bson:"name" json:"name" binding:"required"`
	Type      string             `bson:"type" json:"type" binding:"required"` // text, number, boolean, select
	Values    []string           `bson:"values" json:"values"`                // для select типа
	Unit      string             `bson:"unit" json:"unit"`                    // единица измерения
	Required  bool               `bson:"required" json:"required"`
	Status    string             `bson:"status" json:"status"`     // active, inactive
	Category  string             `bson:"category" json:"category"` // для группировки
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type ParameterDTO struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Values    []string  `json:"values"`
	Unit      string    `json:"unit"`
	Required  bool      `json:"required"`
	Status    string    `json:"status"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ParameterCreate struct {
	Name     string   `json:"name" binding:"required"`
	Type     string   `json:"type" binding:"required"`
	Values   []string `json:"values"`
	Unit     string   `json:"unit"`
	Required bool     `json:"required"`
	Status   string   `json:"status"`
	Category string   `json:"category"`
}

type ParameterUpdate struct {
	Name     *string   `json:"name"`
	Type     *string   `json:"type"`
	Values   []string  `json:"values"`
	Unit     *string   `json:"unit"`
	Required *bool     `json:"required"`
	Status   *string   `json:"status"`
	Category *string   `json:"category"`
}

func ToParameterDTO(m Parameter) ParameterDTO {
	return ParameterDTO{
		ID:        m.ID.Hex(),
		TenantID:  m.TenantID,
		Name:      m.Name,
		Type:      m.Type,
		Values:    m.Values,
		Unit:      m.Unit,
		Required:  m.Required,
		Status:    m.Status,
		Category:  m.Category,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
} 