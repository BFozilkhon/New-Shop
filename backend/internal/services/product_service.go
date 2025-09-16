package services

import (
	"context"
	"time"

	"shop/backend/internal/models"
	"shop/backend/internal/repositories"
	"shop/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ProductService struct {
	repo         *repositories.ProductRepository
	categoryRepo *repositories.CategoryRepository
	brandRepo    *repositories.BrandRepository
	supplierRepo *repositories.SupplierRepository
}

func NewProductService(
	repo *repositories.ProductRepository,
	categoryRepo *repositories.CategoryRepository,
	brandRepo *repositories.BrandRepository,
	supplierRepo *repositories.SupplierRepository,
) *ProductService {
	return &ProductService{
		repo:         repo,
		categoryRepo: categoryRepo,
		brandRepo:    brandRepo,
		supplierRepo: supplierRepo,
	}
}

func (s *ProductService) List(ctx context.Context, page, limit int64, search, categoryID string, categoryIDs []string, brandID, supplierID, status string, isActive, isBundle *bool, minPrice, maxPrice *float64, tenantID string, storeID string) ([]models.ProductDTO, int64, error) {
	items, total, err := s.repo.List(ctx, repositories.ProductListParams{
		Page:       page,
		Limit:      limit,
		Sort:       bson.D{{Key: "created_at", Value: -1}},
		Search:     search,
		CategoryID: categoryID,
		CategoryIDs: categoryIDs,
		BrandID:    brandID,
		SupplierID: supplierID,
		Status:     status,
		IsActive:   isActive,
		IsBundle:   isBundle,
		MinPrice:   minPrice,
		MaxPrice:   maxPrice,
		TenantID:   tenantID,
		StoreID:    storeID,
		LowStock:   ctx.Value("low_stock").(*bool),
		ZeroStock:  ctx.Value("zero_stock").(*bool),
		Archived:   ctx.Value("archived").(*bool),
        IsRealizatsiya: ctx.Value("is_realizatsiya").(*bool),
        IsKonsignatsiya: ctx.Value("is_konsignatsiya").(*bool),
        IsDirtyCore: ctx.Value("is_dirty_core").(*bool),
	})
	if err != nil {
		return nil, 0, utils.Internal("PRODUCT_LIST_FAILED", "Unable to list products", err)
	}

	out := make([]models.ProductDTO, len(items))
	for i, product := range items {
		dto := models.ToProductDTO(product)
		
		// Resolve relationship names
		if product.CategoryID != primitive.NilObjectID {
			if category, err := s.categoryRepo.Get(ctx, product.CategoryID); err == nil {
				dto.CategoryName = category.Name
			}
		}

		// Resolve multiple category names if present
		if len(product.CategoryIDs) > 0 {
			names := make([]string, 0, len(product.CategoryIDs))
			for _, cid := range product.CategoryIDs {
				if cid == primitive.NilObjectID { continue }
				if cat, err := s.categoryRepo.Get(ctx, cid); err == nil { names = append(names, cat.Name) }
			}
			dto.CategoryNames = names
		}
		
		if product.BrandID != primitive.NilObjectID {
			if brand, err := s.brandRepo.Get(ctx, product.BrandID, tenantID); err == nil {
				dto.BrandName = brand.Name
			}
		}
		
		if product.SupplierID != primitive.NilObjectID {
			if supplier, err := s.supplierRepo.Get(ctx, product.SupplierID); err == nil {
				dto.SupplierName = supplier.Name
			}
		}
		
		out[i] = dto
	}

	return out, total, nil
}

func (s *ProductService) Get(ctx context.Context, id string, tenantID string) (*models.ProductDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid product id", nil)
	}

	m, err := s.repo.Get(ctx, oid, tenantID)
	if err != nil {
		return nil, utils.NotFound("PRODUCT_NOT_FOUND", "Product not found", err)
	}

	dto := models.ToProductDTO(*m)
	
	// Resolve relationship names
	if m.CategoryID != primitive.NilObjectID {
		if category, err := s.categoryRepo.Get(ctx, m.CategoryID); err == nil {
			dto.CategoryName = category.Name
		}
	}

	if len(m.CategoryIDs) > 0 {
		names := make([]string, 0, len(m.CategoryIDs))
		for _, cid := range m.CategoryIDs {
			if cid == primitive.NilObjectID { continue }
			if cat, err := s.categoryRepo.Get(ctx, cid); err == nil { names = append(names, cat.Name) }
		}
		dto.CategoryNames = names
	}
	
	if m.BrandID != primitive.NilObjectID {
		if brand, err := s.brandRepo.Get(ctx, m.BrandID, tenantID); err == nil {
			dto.BrandName = brand.Name
		}
	}
	
	if m.SupplierID != primitive.NilObjectID {
		if supplier, err := s.supplierRepo.Get(ctx, m.SupplierID); err == nil {
			dto.SupplierName = supplier.Name
		}
	}

	return &dto, nil
}

func (s *ProductService) Create(ctx context.Context, body models.ProductCreate, tenantID string) (*models.ProductDTO, error) {
	if body.Name == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Product name is required", nil)
	}
	if body.SKU == "" {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Product SKU is required", nil)
	}
	if body.Price < 0 {
		return nil, utils.BadRequest("VALIDATION_ERROR", "Product price must be non-negative", nil)
	}

	// Check if SKU already exists
	exists, err := s.repo.CheckSKUExists(ctx, body.SKU, tenantID, nil)
	if err != nil {
		return nil, utils.Internal("SKU_CHECK_FAILED", "Unable to check SKU uniqueness", err)
	}
	if exists {
		return nil, utils.BadRequest("SKU_EXISTS", "Product with this SKU already exists", nil)
	}

	// Validate relationships
	if body.CategoryID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.CategoryID); err == nil {
			if _, err := s.categoryRepo.Get(ctx, oid); err != nil {
				return nil, utils.BadRequest("CATEGORY_NOT_FOUND", "Category not found", nil)
			}
		} else {
			return nil, utils.BadRequest("INVALID_CATEGORY_ID", "Invalid category ID", nil)
		}
	}
	// Validate category_ids if provided
	var categoryIDs []primitive.ObjectID
	if len(body.CategoryIDs) > 0 {
		for _, id := range body.CategoryIDs {
			if id == "" { continue }
			oid, err := primitive.ObjectIDFromHex(id)
			if err != nil { return nil, utils.BadRequest("INVALID_CATEGORY_ID", "Invalid category ID in category_ids", err) }
			if _, err := s.categoryRepo.Get(ctx, oid); err != nil { return nil, utils.BadRequest("CATEGORY_NOT_FOUND", "Category not found in category_ids", nil) }
			categoryIDs = append(categoryIDs, oid)
		}
	}

	if body.BrandID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.BrandID); err == nil {
			if _, err := s.brandRepo.Get(ctx, oid, tenantID); err != nil {
				return nil, utils.BadRequest("BRAND_NOT_FOUND", "Brand not found", nil)
			}
		} else {
			return nil, utils.BadRequest("INVALID_BRAND_ID", "Invalid brand ID", nil)
		}
	}

	if body.SupplierID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.SupplierID); err == nil {
			if _, err := s.supplierRepo.Get(ctx, oid); err != nil {
				return nil, utils.BadRequest("SUPPLIER_NOT_FOUND", "Supplier not found", nil)
			}
		} else {
			return nil, utils.BadRequest("INVALID_SUPPLIER_ID", "Invalid supplier ID", nil)
		}
	}

	m := &models.Product{
		TenantID:    tenantID,
		Name:        body.Name,
		SKU:         body.SKU,
		PartNumber:  body.PartNumber,
		Description: body.Description,
		Price:       body.Price,
		CostPrice:   body.CostPrice,
		Stock:       body.Stock,
		MinStock:    body.MinStock,
		MaxStock:    body.MaxStock,
		Unit:        body.Unit,
		Weight:      body.Weight,
		Dimensions:  body.Dimensions,
		Images:      body.Images,
		Attributes:  body.Attributes,
		Variants:    body.Variants,
		Warehouses:  body.Warehouses,

		CatalogAttributes:      body.CatalogAttributes,
		CatalogCharacteristics: body.CatalogCharacteristics,
		CatalogParameters:      body.CatalogParameters,

		Type:        body.Type,
		IsBundle:    body.IsBundle,
		BundlePrice: body.BundlePrice,
		BundleItems: body.BundleItems,

		Barcode:              body.Barcode,
		ExpirationDate:       body.ExpirationDate,
		IsDirtyCore:          body.IsDirtyCore,
		IsRealizatsiya:       body.IsRealizatsiya,
		IsKonsignatsiya:      body.IsKonsignatsiya,
		KonsignatsiyaDate:    body.KonsignatsiyaDate,
		AdditionalParameters: body.AdditionalParameters,
		Status:               body.Status,
		IsPublished:          body.IsPublished,
		IsActive:             true,
	}

	// Convert string IDs to ObjectIDs
	if body.CategoryID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.CategoryID); err == nil {
			m.CategoryID = oid
		}
	}
	if len(categoryIDs) > 0 {
		m.CategoryIDs = categoryIDs
		// set primary category_id to last provided id if not explicitly set
		if m.CategoryID == primitive.NilObjectID {
			m.CategoryID = categoryIDs[len(categoryIDs)-1]
		}
	}
	if body.BrandID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.BrandID); err == nil {
			m.BrandID = oid
		}
	}
	if body.SupplierID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.SupplierID); err == nil {
			m.SupplierID = oid
		}
	}
	if body.CompanyID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.CompanyID); err == nil { m.CompanyID = oid }
	}
	if body.StoreID != "" {
		if oid, err := primitive.ObjectIDFromHex(body.StoreID); err == nil { m.StoreID = oid }
	}

	created, err := s.repo.Create(ctx, m)
	if err != nil {
		return nil, utils.Internal("PRODUCT_CREATE_FAILED", "Unable to create product", err)
	}

	// Return DTO with resolved names
	return s.Get(ctx, created.ID.Hex(), tenantID)
}

func (s *ProductService) Update(ctx context.Context, id string, body models.ProductUpdate, tenantID string) (*models.ProductDTO, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, utils.BadRequest("INVALID_ID", "Invalid product id", nil)
	}

	// Check if SKU is being updated and if it already exists
	if body.SKU != nil {
		exists, err := s.repo.CheckSKUExists(ctx, *body.SKU, tenantID, &oid)
		if err != nil {
			return nil, utils.Internal("SKU_CHECK_FAILED", "Unable to check SKU uniqueness", err)
		}
		if exists {
			return nil, utils.BadRequest("SKU_EXISTS", "Product with this SKU already exists", nil)
		}
	}

	update := bson.M{}
	
	// Basic fields
	if body.Name != nil {
		if *body.Name == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Product name cannot be empty", nil)
		}
		update["name"] = *body.Name
	}
	if body.SKU != nil {
		if *body.SKU == "" {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Product SKU cannot be empty", nil)
		}
		update["sku"] = *body.SKU
	}
	if body.PartNumber != nil {
		update["part_number"] = *body.PartNumber
	}
	if body.Description != nil {
		update["description"] = *body.Description
	}
	if body.Price != nil {
		if *body.Price < 0 {
			return nil, utils.BadRequest("VALIDATION_ERROR", "Product price must be non-negative", nil)
		}
		update["price"] = *body.Price
	}
	if body.CostPrice != nil {
		update["cost_price"] = *body.CostPrice
	}
	if body.Stock != nil {
		update["stock"] = *body.Stock
	}
	if body.MinStock != nil {
		update["min_stock"] = *body.MinStock
	}
	if body.MaxStock != nil {
		update["max_stock"] = *body.MaxStock
	}
	if body.Unit != nil {
		update["unit"] = *body.Unit
	}
	if body.Weight != nil {
		update["weight"] = *body.Weight
	}
	if body.Dimensions != nil {
		update["dimensions"] = *body.Dimensions
	}

	// Relationship fields
	if body.CategoryID != nil {
		if *body.CategoryID == "" {
			update["category_id"] = primitive.NilObjectID
		} else {
			if oid, err := primitive.ObjectIDFromHex(*body.CategoryID); err == nil {
				if _, err := s.categoryRepo.Get(ctx, oid); err != nil {
					return nil, utils.BadRequest("CATEGORY_NOT_FOUND", "Category not found", nil)
				}
				update["category_id"] = oid
			} else {
				return nil, utils.BadRequest("INVALID_CATEGORY_ID", "Invalid category ID", nil)
			}
		}
	}
	// category_ids array
	if body.CategoryIDs != nil {
		ids := []primitive.ObjectID{}
		for _, id := range body.CategoryIDs {
			if id == "" { continue }
			cid, err := primitive.ObjectIDFromHex(id)
			if err != nil { return nil, utils.BadRequest("INVALID_CATEGORY_ID", "Invalid category id in category_ids", err) }
			if _, err := s.categoryRepo.Get(ctx, cid); err != nil { return nil, utils.BadRequest("CATEGORY_NOT_FOUND", "Category not found in category_ids", nil) }
			ids = append(ids, cid)
		}
		update["category_ids"] = ids
	}

	if body.BrandID != nil {
		if *body.BrandID == "" {
			update["brand_id"] = primitive.NilObjectID
		} else {
			if oid, err := primitive.ObjectIDFromHex(*body.BrandID); err == nil {
				if _, err := s.brandRepo.Get(ctx, oid, tenantID); err != nil {
					return nil, utils.BadRequest("BRAND_NOT_FOUND", "Brand not found", nil)
				}
				update["brand_id"] = oid
			} else {
				return nil, utils.BadRequest("INVALID_BRAND_ID", "Invalid brand ID", nil)
			}
		}
	}
	
	if body.SupplierID != nil {
		if *body.SupplierID == "" {
			update["supplier_id"] = primitive.NilObjectID
		} else {
			if oid, err := primitive.ObjectIDFromHex(*body.SupplierID); err == nil {
				if _, err := s.supplierRepo.Get(ctx, oid); err != nil {
					return nil, utils.BadRequest("SUPPLIER_NOT_FOUND", "Supplier not found", nil)
				}
				update["supplier_id"] = oid
			} else {
				return nil, utils.BadRequest("INVALID_SUPPLIER_ID", "Invalid supplier ID", nil)
			}
		}
	}

	if body.CompanyID != nil {
		if *body.CompanyID == "" { update["company_id"] = primitive.NilObjectID } else {
			if oid, err := primitive.ObjectIDFromHex(*body.CompanyID); err == nil { update["company_id"] = oid } else { return nil, utils.BadRequest("INVALID_COMPANY_ID", "Invalid company ID", nil) }
		}
	}
	if body.StoreID != nil {
		if *body.StoreID == "" { update["store_id"] = primitive.NilObjectID } else {
			if oid, err := primitive.ObjectIDFromHex(*body.StoreID); err == nil { update["store_id"] = oid } else { return nil, utils.BadRequest("INVALID_STORE_ID", "Invalid store ID", nil) }
		}
	}

	// Array fields
	if body.Images != nil {
		update["images"] = body.Images
	}
	if body.Attributes != nil {
		update["attributes"] = body.Attributes
	}
	if body.Variants != nil {
		update["variants"] = body.Variants
	}
	if body.Warehouses != nil {
		update["warehouses"] = body.Warehouses
	}

	// Catalog relationships
	if body.CatalogAttributes != nil {
		update["catalog_attributes"] = body.CatalogAttributes
	}
	if body.CatalogCharacteristics != nil {
		update["catalog_characteristics"] = body.CatalogCharacteristics
	}
	if body.CatalogParameters != nil {
		update["catalog_parameters"] = body.CatalogParameters
	}

	// Bundle fields
	if body.Type != nil {
		if !s.isValidType(*body.Type) {
			return nil, utils.BadRequest("INVALID_TYPE", "Invalid product type. Valid types: single, bundle", nil)
		}
		update["type"] = *body.Type
	}
	if body.IsBundle != nil {
		update["is_bundle"] = *body.IsBundle
	}
	if body.BundlePrice != nil {
		update["bundle_price"] = *body.BundlePrice
	}
	if body.BundleItems != nil {
		update["bundle_items"] = body.BundleItems
	}

	// Other fields
	if body.Barcode != nil {
		update["barcode"] = *body.Barcode
	}
	if body.ExpirationDate != nil {
		update["expiration_date"] = *body.ExpirationDate
	}
	if body.IsDirtyCore != nil {
		update["is_dirty_core"] = *body.IsDirtyCore
	}
	if body.IsRealizatsiya != nil {
		update["is_realizatsiya"] = *body.IsRealizatsiya
	}
	if body.IsKonsignatsiya != nil {
		update["is_konsignatsiya"] = *body.IsKonsignatsiya
	}
	if body.KonsignatsiyaDate != nil {
		update["konsignatsiya_date"] = *body.KonsignatsiyaDate
	}
	if body.AdditionalParameters != nil {
		update["additional_parameters"] = body.AdditionalParameters
	}
	if body.Status != nil {
		if !s.isValidStatus(*body.Status) {
			return nil, utils.BadRequest("INVALID_STATUS", "Invalid product status. Valid statuses: active, inactive", nil)
		}
		update["status"] = *body.Status
	}
	if body.IsPublished != nil {
		update["is_published"] = *body.IsPublished
	}
	if body.IsActive != nil {
		update["is_active"] = *body.IsActive
	}

	updated, err := s.repo.Update(ctx, oid, tenantID, update)
	if err != nil {
		return nil, utils.Internal("PRODUCT_UPDATE_FAILED", "Unable to update product", err)
	}

	// Return DTO with resolved names
	return s.Get(ctx, updated.ID.Hex(), tenantID)
}

func (s *ProductService) Delete(ctx context.Context, id string, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid product id", nil)
	}

	if err := s.repo.Delete(ctx, oid, tenantID); err != nil {
		return utils.Internal("PRODUCT_DELETE_FAILED", "Unable to delete product", err)
	}

	return nil
}

func (s *ProductService) UpdateStock(ctx context.Context, id string, stock int, tenantID string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.BadRequest("INVALID_ID", "Invalid product id", nil)
	}

	if stock < 0 {
		return utils.BadRequest("VALIDATION_ERROR", "Stock cannot be negative", nil)
	}

	if err := s.repo.UpdateStock(ctx, oid, tenantID, stock); err != nil {
		return utils.Internal("STOCK_UPDATE_FAILED", "Unable to update product stock", err)
	}

	return nil
}

func (s *ProductService) BulkDelete(ctx context.Context, ids []string, tenantID string) (int64, error) {
	if len(ids) == 0 { return 0, utils.BadRequest("EMPTY_IDS", "No products selected", nil) }
	list := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids {
		oid, err := primitive.ObjectIDFromHex(id); if err != nil { return 0, utils.BadRequest("INVALID_ID", "Invalid product id in list", err) }
		list = append(list, oid)
	}
	count, err := s.repo.BulkDelete(ctx, list, tenantID)
	if err != nil { return 0, utils.Internal("PRODUCT_BULK_DELETE_FAILED", "Unable to delete products", err) }
	return count, nil
}

func (s *ProductService) BulkArchive(ctx context.Context, ids []string, archived bool, tenantID string) (int64, error) {
	if len(ids) == 0 { return 0, utils.BadRequest("EMPTY_IDS", "No products selected", nil) }
	list := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids { oid, err := primitive.ObjectIDFromHex(id); if err != nil { return 0, utils.BadRequest("INVALID_ID", "Invalid product id in list", err) }; list = append(list, oid) }
	count, err := s.repo.BulkArchive(ctx, list, tenantID, archived)
	if err != nil { return 0, utils.Internal("PRODUCT_BULK_ARCHIVE_FAILED", "Unable to update archive state", err) }
	return count, nil
}

type BulkEditProps struct {
	BrandID      *string     `json:"brand_id"`
	CategoryID   *string     `json:"category_id"`
	ExpirationDate *string   `json:"expiration_date"`
}

func (s *ProductService) BulkEditProperties(ctx context.Context, ids []string, props BulkEditProps, tenantID string) (int64, error) {
	if len(ids) == 0 { return 0, utils.BadRequest("EMPTY_IDS", "No products selected", nil) }
	list := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids { oid, err := primitive.ObjectIDFromHex(id); if err != nil { return 0, utils.BadRequest("INVALID_ID", "Invalid product id in list", err) }; list = append(list, oid) }

	update := bson.M{}
	if props.BrandID != nil {
		if *props.BrandID == "" { update["brand_id"] = primitive.NilObjectID } else {
			bid, err := primitive.ObjectIDFromHex(*props.BrandID); if err != nil { return 0, utils.BadRequest("INVALID_BRAND_ID", "Invalid brand id", err) }
			if _, err := s.brandRepo.Get(ctx, bid, tenantID); err != nil { return 0, utils.BadRequest("BRAND_NOT_FOUND", "Brand not found", nil) }
			update["brand_id"] = bid
		}
	}
	if props.CategoryID != nil {
		if *props.CategoryID == "" { update["category_id"] = primitive.NilObjectID } else {
			cid, err := primitive.ObjectIDFromHex(*props.CategoryID); if err != nil { return 0, utils.BadRequest("INVALID_CATEGORY_ID", "Invalid category id", err) }
			if _, err := s.categoryRepo.Get(ctx, cid); err != nil { return 0, utils.BadRequest("CATEGORY_NOT_FOUND", "Category not found", nil) }
			update["category_id"] = cid
		}
	}
	if props.ExpirationDate != nil {
		if *props.ExpirationDate == "" { update["expiration_date"] = nil } else {
			if ts, err := time.Parse(time.RFC3339, *props.ExpirationDate); err == nil {
				update["expiration_date"] = ts
			} else if ts2, err2 := time.Parse("2006-01-02", *props.ExpirationDate); err2 == nil {
				update["expiration_date"] = ts2
			} else {
				return 0, utils.BadRequest("INVALID_DATE", "Invalid expiration date format", err)
			}
		}
	}
	if len(update) == 0 { return 0, utils.BadRequest("NO_FIELDS", "No fields to update", nil) }

	count, err := s.repo.BulkUpdateProperties(ctx, list, tenantID, update)
	if err != nil { return 0, utils.Internal("PRODUCT_BULK_EDIT_FAILED", "Unable to update products", err) }
	return count, nil
}

func (s *ProductService) Stats(ctx context.Context, tenantID, storeID string) (*repositories.ProductStats, error) {
	return s.repo.Stats(ctx, tenantID, storeID)
}

func (s *ProductService) Summary(ctx context.Context, tenantID, storeID string) (*repositories.ProductSummary, error) {
	return s.repo.Summary(ctx, tenantID, storeID)
}

func (s *ProductService) isValidType(productType string) bool {
	validTypes := []string{
		models.ProductTypeSingle,
		models.ProductTypeBundle,
	}

	for _, validType := range validTypes {
		if productType == validType {
			return true
		}
	}
	return false
}

func (s *ProductService) isValidStatus(status string) bool {
	validStatuses := []string{
		models.ProductStatusActive,
		models.ProductStatusInactive,
	}

	for _, validStatus := range validStatuses {
		if status == validStatus {
			return true
		}
	}
	return false
} 