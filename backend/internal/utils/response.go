package utils

import (
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type SuccessResponse[T any] struct { Data T `json:"data"` }

type Paginated[T any] struct { Items []T `json:"items"`; Total int64 `json:"total"` }

type ErrorResponse struct { Code string `json:"code"`; Message string `json:"message"` }

func Success[T any](c *fiber.Ctx, data T) error { return c.Status(fiber.StatusOK).JSON(SuccessResponse[T]{Data: data}) }
func Created[T any](c *fiber.Ctx, data T) error { return c.Status(fiber.StatusCreated).JSON(SuccessResponse[T]{Data: data}) }
func NoContent(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusNoContent) }

func SuccessMessage(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusOK).JSON(map[string]string{"message": message})
}

func FiberErrorHandler(logger *zap.Logger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		reqID := c.Locals("requestid")
		if appErr, ok := err.(*AppError); ok {
			logger.Error("request failed", zap.String("code", appErr.Code), zap.String("path", c.Path()), zap.Any("request_id", reqID), zap.Int("status", appErr.Status), zap.Error(appErr.Err))
			return c.Status(appErr.Status).JSON(ErrorResponse{Code: appErr.Code, Message: appErr.Message})
		}
		logger.Error("internal error", zap.String("path", c.Path()), zap.Any("request_id", reqID), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Code: "INTERNAL_ERROR", Message: "Something went wrong"})
	}
} 