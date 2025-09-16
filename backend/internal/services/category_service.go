package services

import (
	"context"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CategoryService struct {
	repo *repositories.CategoryRepository
}

func NewCategoryService(repo *repositories.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) List(ctx context.Context, page, limit int64, search string, isActive *bool, parentID *string, level *int) ([]models.CategoryDTO, int64, error) {
	var parentOID *primitive.ObjectID
	if parentID != nil && *parentID != "" {
		if oid, err := primitive.ObjectIDFromHex(*parentID); err == nil { parentOID = &oid }
	}
	var levelPtr *int
	if level != nil { levelPtr = level }
	items, total, err := s.repo.List(ctx, repositories.CategoryListParams{ Page: page, Limit: limit, Sort: bson.D{{Key: "name", Value: 1}}, Search: search, IsActive: isActive, ParentID: parentOID, Level: levelPtr })
	if err != nil { return nil, 0, utils.Internal("CATEGORY_LIST_FAILED", "Unable to list categories", err) }
	out := make([]models.CategoryDTO, len(items))
	for i, cat := range items { out[i] = models.ToCategoryDTO(cat) }
	return out, total, nil
}

func (s *CategoryService) Get(ctx context.Context, id string) (*models.CategoryDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid category id", nil) }
	m, err := s.repo.Get(ctx, oid)
	if err != nil { return nil, utils.NotFound("CATEGORY_NOT_FOUND", "Category not found", err) }
	dto := models.ToCategoryDTO(*m)
	return &dto, nil
}

func (s *CategoryService) GetTree(ctx context.Context) ([]models.CategoryDTO, error) {
	all, err := s.repo.ListAll(ctx)
	if err != nil { return nil, utils.Internal("CATEGORY_TREE_FAILED", "Unable to fetch categories", err) }
	// product counts by category
	counts, err := s.countProductsByCategory(ctx)
	if err != nil { return nil, err }
	childrenMap := map[string][]models.CategoryDTO{}
	var roots []models.CategoryDTO
	for _, c := range all {
		d := models.ToCategoryDTO(c)
		if v, ok := counts[c.ID.Hex()]; ok { d.ProductCount = v }
		if c.ParentID == nil { roots = append(roots, d); continue }
		pid := c.ParentID.Hex(); childrenMap[pid] = append(childrenMap[pid], d)
	}
	var attach func(*models.CategoryDTO)
	attach = func(n *models.CategoryDTO) {
		kids := childrenMap[n.ID]
		if len(kids) == 0 { return }
		n.Children = make([]models.CategoryDTO, len(kids))
		copy(n.Children, kids)
		for i := range n.Children { attach(&n.Children[i]) }
	}
	for i := range roots { attach(&roots[i]) }
	return roots, nil
}

func (s *CategoryService) Create(ctx context.Context, body models.CategoryCreate) (*models.CategoryDTO, error) {
	if body.Name == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Category name is required", nil) }
	var parentOID *primitive.ObjectID
	level := 0
	if body.ParentID != nil && *body.ParentID != "" {
		poid, err := primitive.ObjectIDFromHex(*body.ParentID); if err != nil { return nil, utils.BadRequest("INVALID_PARENT", "Invalid parent_id", err) }
		parentOID = &poid
		parent, err := s.repo.Get(ctx, poid); if err != nil { return nil, utils.BadRequest("PARENT_NOT_FOUND", "Parent category not found", err) }
		level = parent.Level + 1
	}
	m := &models.Category{ Name: body.Name, ParentID: parentOID, Level: level, IsActive: true, IsDeleted: false }
	created, err := s.repo.Create(ctx, m); if err != nil { return nil, utils.Internal("CATEGORY_CREATE_FAILED", "Unable to create category", err) }
	dto := models.ToCategoryDTO(*created); return &dto, nil
}

func (s *CategoryService) Update(ctx context.Context, id string, body models.CategoryUpdate) (*models.CategoryDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return nil, utils.BadRequest("INVALID_ID", "Invalid category id", nil) }
	if _, err := s.repo.Get(ctx, oid); err != nil { return nil, utils.NotFound("CATEGORY_NOT_FOUND", "Category not found", err) }
	update := bson.M{}
	if body.Name != nil { if *body.Name == "" { return nil, utils.BadRequest("VALIDATION_ERROR", "Category name cannot be empty", nil) }; update["name"] = *body.Name }
	if body.ParentID != nil {
		var parentOID *primitive.ObjectID; level := 0
		if *body.ParentID != "" { poid, err := primitive.ObjectIDFromHex(*body.ParentID); if err != nil { return nil, utils.BadRequest("INVALID_PARENT", "Invalid parent_id", err) }; if poid == oid { return nil, utils.BadRequest("CIRCULAR_REFERENCE", "Category cannot be its own parent", nil) }; parent, err := s.repo.Get(ctx, poid); if err != nil { return nil, utils.BadRequest("PARENT_NOT_FOUND", "Parent category not found", err) }; if err := s.checkCircularReference(ctx, oid, poid); err != nil { return nil, err }; parentOID = &poid; level = parent.Level + 1 }
		update["parent_id"] = parentOID; update["level"] = level; if err := s.updateChildrenLevels(ctx, oid, level); err != nil { return nil, err }
	}
	if body.IsActive != nil { update["is_active"] = *body.IsActive }
	updated, err := s.repo.Update(ctx, oid, update); if err != nil { return nil, utils.Internal("CATEGORY_UPDATE_FAILED", "Unable to update category", err) }
	dto := models.ToCategoryDTO(*updated); return &dto, nil
}

func (s *CategoryService) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id); if err != nil { return utils.BadRequest("INVALID_ID", "Invalid category id", nil) }
	// recursively delete descendants first
	if err := s.deleteRecursively(ctx, oid); err != nil { return err }
	return nil
}

func (s *CategoryService) deleteRecursively(ctx context.Context, id primitive.ObjectID) error {
	children, err := s.repo.GetChildren(ctx, id); if err != nil { return err }
	for _, ch := range children { if err := s.deleteRecursively(ctx, ch.ID); err != nil { return err } }
	return s.repo.Delete(ctx, id)
}

func (s *CategoryService) checkCircularReference(ctx context.Context, categoryID, proposedParentID primitive.ObjectID) error {
	children, err := s.repo.GetChildren(ctx, categoryID); if err != nil { return utils.Internal("CHECK_CIRCULAR_FAILED", "Unable to check for circular reference", err) }
	for _, child := range children { if child.ID == proposedParentID { return utils.BadRequest("CIRCULAR_REFERENCE", "Cannot make a descendant category as parent", nil) }; if err := s.checkCircularReference(ctx, child.ID, proposedParentID); err != nil { return err } }
	return nil
}

func (s *CategoryService) updateChildrenLevels(ctx context.Context, parentID primitive.ObjectID, parentLevel int) error {
	children, err := s.repo.GetChildren(ctx, parentID); if err != nil { return err }
	for _, child := range children { newLevel := parentLevel + 1; if _, err := s.repo.Update(ctx, child.ID, bson.M{"level": newLevel}); err != nil { return err }; if err := s.updateChildrenLevels(ctx, child.ID, newLevel); err != nil { return err } }
	return nil
}

func (s *CategoryService) countProductsByCategory(ctx context.Context) (map[string]int64, error) {
	// aggregate products grouped by both category_id and elements of category_ids
	col := s.repo.Col().Database().Collection("products")
	pipeline := mongo.Pipeline{
		// Compute arrays arr1 (single category_id if present) and arr2 (category_ids or empty), then union to keys
		bson.D{{Key: "$project", Value: bson.M{
			"arr1": bson.M{"$cond": bson.A{bson.M{"$ne": bson.A{"$category_id", nil}}, bson.A{"$category_id"}, bson.A{}}},
			"arr2": bson.M{"$ifNull": bson.A{"$category_ids", bson.A{}}},
		}}},
		bson.D{{Key: "$project", Value: bson.M{
			"keys": bson.M{"$setUnion": bson.A{"$arr1", "$arr2"}},
		}}},
		bson.D{{Key: "$unwind", Value: "$keys"}},
		bson.D{{Key: "$group", Value: bson.M{"_id": "$keys", "count": bson.M{"$sum": 1}}}},
	}
	cur, err := col.Aggregate(ctx, pipeline)
	if err != nil { return nil, utils.Internal("PRODUCT_COUNT_FAILED", "Unable to count products per category", err) }
	defer cur.Close(ctx)
	res := map[string]int64{}
	for cur.Next(ctx) {
		var row struct{ ID *primitive.ObjectID `bson:"_id"`; Count int64 `bson:"count"` }
		if err := cur.Decode(&row); err != nil { continue }
		if row.ID != nil { res[row.ID.Hex()] = row.Count }
	}
	return res, nil
} 