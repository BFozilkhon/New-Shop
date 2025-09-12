package services

import (
	"context"
	"fmt"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CategoryService struct {
	repo *repositories.CategoryRepository
}

func NewCategoryService(repo *repositories.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) List(ctx context.Context, page, limit int64, search string, isActive *bool, _ *string, _ *int) ([]models.CategoryDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.CategoryListParams{
		Page:     page,
		Limit:    limit,
		Sort:     bson.D{{Key: "name", Value: 1}},
		Search:   search,
		IsActive: isActive,
	})
	if err != nil {
		return nil, 0, utils.Internal("CATEGORY_LIST_FAILED", "Unable to list categories", err)
	}

	out := make([]models.CategoryDTO, len(items))
	for i, cat := range items { out[i] = models.ToCategoryDTO(cat) }

	return out, total, nil
}

func (s *CategoryService) Get(ctx context.Context, id string) (*models.CategoryDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid category id", nil)
	}

	m, err := s.repo.Get(ctx, oid)
	if err != nil {
		return nil, utils.NotFound("CATEGORY_NOT_FOUND", "Category not found", err)
	}

	dto := models.ToCategoryDTO(*m)
	
	return &dto, nil
}

// Tree is no longer supported
func (s *CategoryService) GetTree(ctx context.Context) ([]models.CategoryDTO, error) { return []models.CategoryDTO{}, nil }

func (s *CategoryService) getCategoryChildren(ctx context.Context, parentID primitive.ObjectID) ([]models.CategoryDTO, error) {
	children, err := s.repo.GetChildren(ctx, parentID)
	if err != nil {
		return nil, err
	}

	result := make([]models.CategoryDTO, len(children))
	for i, child := range children { result[i] = models.ToCategoryDTO(child) }

	return result, nil
}

func (s *CategoryService) Create(ctx context.Context, body models.CategoryCreate) (*models.CategoryDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Category name is required", nil)
	}
	m := &models.Category{
		Name:     body.Name,
		Image:    body.Image,
		IsActive: true,
		IsDeleted: false,
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("CATEGORY_CREATE_FAILED", "Unable to create category", err)
	}

	dto := models.ToCategoryDTO(*created)
	return &dto, nil
}

func (s *CategoryService) Update(ctx context.Context, id string, body models.CategoryUpdate) (*models.CategoryDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid category id", nil)
	}

	if _, err := s.repo.Get(ctx, oid); err != nil {
		return nil, utils.NotFound("CATEGORY_NOT_FOUND", "Category not found", err)
	}

	update := bson.M{}

	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Category name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}

	if body.Image != nil {
		update["image"] = *body.Image
	}

	if body.IsActive != nil {
		update["is_active"] = *body.IsActive
	}

	updated, err := s.repo.Update(ctx, oid, update)
	if err != nil {
		return nil, utils.Internal("CATEGORY_UPDATE_FAILED", "Unable to update category", err)
	}

	dto := models.ToCategoryDTO(*updated)
	return &dto, nil
}

func (s *CategoryService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid category id", nil)
	}

	if err := s.repo.Delete(ctx, oid); err != nil {
		return utils.Internal("CATEGORY_DELETE_FAILED", "Unable to delete category", err)
	}

	return nil
}

func (s *CategoryService) checkCircularReference(ctx context.Context, categoryID, proposedParentID primitive.ObjectID) error {
	// Check if proposed parent is a descendant of the category
	children, err := s.repo.GetChildren(ctx, categoryID)
	if err != nil {
		return utils.Internal("CHECK_CIRCULAR_FAILED", "Unable to check for circular reference", err)
	}

	for _, child := range children {
		if child.ID == proposedParentID {
			return utils.BadRequest("CIRCULAR_REFERENCE", "Cannot make a descendant category as parent", nil)
		}
		// Check recursively
		if err := s.checkCircularReference(ctx, child.ID, proposedParentID); err != nil {
			return err
		}
	}

	return nil
}

func (s *CategoryService) updateChildrenLevels(ctx context.Context, parentID primitive.ObjectID, parentLevel int) error {
	children, err := s.repo.GetChildren(ctx, parentID)
	if err != nil {
		return err
	}

	for _, child := range children {
		newLevel := parentLevel + 1
		if newLevel > 2 {
			return utils.BadRequest("MAX_LEVEL_EXCEEDED", fmt.Sprintf("Moving category would exceed maximum depth for child: %s", child.Name), nil)
		}

		update := bson.M{"level": newLevel}
		if _, err := s.repo.Update(ctx, child.ID, update); err != nil {
			return err
		}

		// Update grandchildren recursively
		if err := s.updateChildrenLevels(ctx, child.ID, newLevel); err != nil {
			return err
		}
	}

	return nil
} 