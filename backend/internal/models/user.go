package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Name         string             `bson:"name"`
	Email        string             `bson:"email"`
	Avatar       string             `bson:"avatar,omitempty"`
	PasswordHash string             `bson:"password_hash"`
	RoleID       primitive.ObjectID `bson:"role_id"`
	Phone        string             `bson:"phone,omitempty"`
	Gender       string             `bson:"gender,omitempty"`
	DateOfBirth  string             `bson:"date_of_birth,omitempty"`
	IsActive     bool               `bson:"is_active"`
	IsDeleted    bool               `bson:"is_deleted"`
	PrefServiceMode bool            `bson:"pref_service_mode,omitempty"`
	PrefLanguage string             `bson:"pref_language,omitempty"`
	CreatedAt    time.Time          `bson:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"`
}

type UserDTO struct {
	ID string `json:"id"`
	Name string `json:"name"`
	Email string `json:"email"`
	Avatar string `json:"avatar,omitempty"`
	RoleID string `json:"role_id"`
	RoleName string `json:"role_name"`
	Phone string `json:"phone"`
	Gender string `json:"gender"`
	DateOfBirth string `json:"date_of_birth"`
	IsActive bool `json:"is_active"`
	IsDeleted bool `json:"is_deleted"`
	PrefServiceMode bool `json:"pref_service_mode"`
	PrefLanguage string `json:"pref_language"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserCreate struct {
	Name string `json:"name"`
	Email string `json:"email"`
	Avatar string `json:"avatar,omitempty"`
	Password string `json:"password"`
	RoleID string `json:"role_id"`
	Phone string `json:"phone,omitempty"`
	Gender string `json:"gender,omitempty"`
	DateOfBirth string `json:"date_of_birth,omitempty"`
}

type UserUpdate struct {
	Name *string `json:"name"`
	Email *string `json:"email"`
	Avatar *string `json:"avatar,omitempty"`
	Password *string `json:"password"`
	RoleID *string `json:"role_id"`
	Phone *string `json:"phone"`
	Gender *string `json:"gender"`
	DateOfBirth *string `json:"date_of_birth"`
	IsActive *bool `json:"is_active"`
	PrefServiceMode *bool `json:"pref_service_mode"`
	PrefLanguage *string `json:"pref_language"`
} 