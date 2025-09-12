package handlers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"shop/backend/internal/utils"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) Register(r fiber.Router) {
	r.Post("/upload/images", h.UploadImages)
	r.Static("/uploads", "/tmp/uploads")
}

func (h *UploadHandler) UploadImages(c *fiber.Ctx) error {
	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return utils.BadRequest("INVALID_FORM", "Invalid multipart form", err)
	}

	files := form.File["images"]
	if len(files) == 0 {
		return utils.BadRequest("NO_FILES", "No files provided", nil)
	}

	// Check file count limit
	if len(files) > 10 {
		return utils.BadRequest("TOO_MANY_FILES", "Maximum 10 files allowed", nil)
	}

	tenantID := c.Locals("tenant_id").(string)
	uploadedUrls := []string{}

	// Create uploads directory if it doesn't exist
	uploadDir := fmt.Sprintf("/tmp/uploads/%s", tenantID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return utils.Internal("UPLOAD_DIR_FAILED", "Failed to create upload directory", err)
	}

	for _, file := range files {
		// Check file size (10MB limit)
		if file.Size > 10*1024*1024 {
			return utils.BadRequest("FILE_TOO_LARGE", fmt.Sprintf("File %s exceeds 10MB limit", file.Filename), nil)
		}

		// Check file type (images only)
		contentType := file.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, "image/") {
			return utils.BadRequest("INVALID_FILE_TYPE", fmt.Sprintf("File %s is not an image", file.Filename), nil)
		}

		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), strings.ReplaceAll(file.Filename, ext, ""), ext)
		filepath := filepath.Join(uploadDir, filename)

		// Save file
		src, err := file.Open()
		if err != nil {
			return utils.Internal("FILE_OPEN_FAILED", "Failed to open uploaded file", err)
		}
		defer src.Close()

		dst, err := os.Create(filepath)
		if err != nil {
			return utils.Internal("FILE_CREATE_FAILED", "Failed to create file", err)
		}
		defer dst.Close()

		if _, err := io.Copy(dst, src); err != nil {
			return utils.Internal("FILE_COPY_FAILED", "Failed to save file", err)
		}

		// Generate URL
		fileUrl := fmt.Sprintf("/uploads/%s/%s", tenantID, filename)
		uploadedUrls = append(uploadedUrls, fileUrl)
	}

	return c.JSON(utils.SuccessResponse[map[string]interface{}]{
		Data: map[string]interface{}{
			"urls": uploadedUrls,
		},
	})
} 