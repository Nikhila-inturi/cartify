package com.ordermgmt.dto;

import com.ordermgmt.model.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// ── Request DTOs ─────────────────────────────────────────────────────────────

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class CreateOrderItemRequest {
    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Product name is required")
    private String productName;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull @DecimalMin(value = "0.01")
    private BigDecimal unitPrice;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class CreateOrderRequest {
    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @Email(message = "Valid email required")
    @NotBlank
    private String customerEmail;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @Valid
    @NotEmpty(message = "Order must have at least one item")
    private List<CreateOrderItemRequest> items;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class OrderItemResponse {
    private Long id;
    private String productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class OrderResponse {
    private Long id;
    private String orderNumber;
    private String customerId;
    private String customerEmail;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class UpdateOrderStatusRequest {
    @NotNull(message = "Status is required")
    private OrderStatus status;
}

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class LoginRequest {
    @NotBlank private String username;
    @NotBlank private String password;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private long expiresIn;
}
