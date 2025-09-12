package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CharacteristicService struct {
	repo *repositories.CharacteristicRepository
}

func NewCharacteristicService(repo *repositories.CharacteristicRepository) *CharacteristicService {
	return &CharacteristicService{repo: repo}
}

func (s *CharacteristicService) List(ctx context.Context, page, limit int64, search string, isActive *bool, characteristicType string) ([]models.CharacteristicDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.CharacteristicListParams{
		Page:     page,
		Limit:    limit,
		Sort:     bson.D{{Key: "name", Value: 1}},
		Search:   search,
		IsActive: isActive,
		Type:     characteristicType,
	})
	if err != nil {
		return nil, 0, utils.Internal("CHARACTERISTIC_LIST_FAILED", "Unable to list characteristics", err)
	}

	out := make([]models.CharacteristicDTO, len(items))
	for i, char := range items {
		out[i] = models.ToCharacteristicDTO(char)
	}

	return out, total, nil
}

func (s *CharacteristicService) Get(ctx context.Context, id string) (*models.CharacteristicDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid characteristic id", nil)
	}

	m, err := s.repo.Get(ctx, oid)
	if err != nil {
		return nil, utils.NotFound("CHARACTERISTIC_NOT_FOUND", "Characteristic not found", err)
	}

	dto := models.ToCharacteristicDTO(*m)
	return &dto, nil
}

func (s *CharacteristicService) Create(ctx context.Context, body models.CharacteristicCreate) (*models.CharacteristicDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Characteristic name is required", nil)
	}

	// Set default type if not provided
	characteristicType := body.Type
	if characteristicType == "" {
		characteristicType = models.CharacteristicTypeText
	}

	// Validate type
	if !s.isValidType(characteristicType) {
		return nil, utils.BadRequest("INVALID_TYPE", "Invalid characteristic type. Valid types: text, number, select, boolean", nil)
	}

	m := &models.Characteristic{
		Name:      body.Name,
		Type:      characteristicType,
		IsActive:  true,
		IsDeleted: false,
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("CHARACTERISTIC_CREATE_FAILED", "Unable to create characteristic", err)
	}

	dto := models.ToCharacteristicDTO(*created)
	return &dto, nil
}

func (s *CharacteristicService) Update(ctx context.Context, id string, body models.CharacteristicUpdate) (*models.CharacteristicDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid characteristic id", nil)
	}

	update := bson.M{}
	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Characteristic name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}
	if body.Type != nil {
		if !s.isValidType(*body.Type) {
			return nil, utils.BadRequest("INVALID_TYPE", "Invalid characteristic type. Valid types: text, number, select, boolean", nil)
		}
		update["type"] = *body.Type
	}
	if body.IsActive != nil {
		update["is_active"] = *body.IsActive
	}

	updated, err := s.repo.Update(ctx, oid, update)
	if err != nil {
		return nil, utils.Internal("CHARACTERISTIC_UPDATE_FAILED", "Unable to update characteristic", err)
	}

	dto := models.ToCharacteristicDTO(*updated)
	return &dto, nil
}

func (s *CharacteristicService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid characteristic id", nil)
	}

	if err := s.repo.Delete(ctx, oid); err != nil {
		return utils.Internal("CHARACTERISTIC_DELETE_FAILED", "Unable to delete characteristic", err)
	}

	return nil
}

func (s *CharacteristicService) isValidType(characteristicType string) bool {
	validTypes := []string{
		models.CharacteristicTypeText,
		models.CharacteristicTypeNumber,
		models.CharacteristicTypeSelect,
		models.CharacteristicTypeBool,
	}

	for _, validType := range validTypes {
		if characteristicType == validType {
			return true
		}
	}
	return false
} 