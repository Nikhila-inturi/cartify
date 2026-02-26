package com.ordermgmt.service;

import com.ordermgmt.model.*;
import com.ordermgmt.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String ORDER_TOPIC   = "order-events";
    private static final String CACHE_NAME    = "orders";

    @Transactional
    public Order createOrder(String customerId, String customerEmail,
                             String shippingAddress, List<OrderItemRequest> itemRequests) {
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .customerId(customerId)
                .customerEmail(customerEmail)
                .shippingAddress(shippingAddress)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest req : itemRequests) {
            BigDecimal subtotal = req.unitPrice().multiply(BigDecimal.valueOf(req.quantity()));
            OrderItem item = OrderItem.builder()
                    .productId(req.productId())
                    .productName(req.productName())
                    .quantity(req.quantity())
                    .unitPrice(req.unitPrice())
                    .subtotal(subtotal)
                    .build();
            order.addItem(item);
            total = total.add(subtotal);
        }
        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);
        log.info("Order created: {}", saved.getOrderNumber());

        // Publish event to Kafka — notification-service picks this up
        kafkaTemplate.send(ORDER_TOPIC, saved.getOrderNumber(),
                Map.of(
                    "event", "ORDER_CREATED",
                    "orderNumber", saved.getOrderNumber(),
                    "customerId", saved.getCustomerId(),
                    "customerEmail", saved.getCustomerEmail(),
                    "totalAmount", saved.getTotalAmount(),
                    "timestamp", LocalDateTime.now().toString()
                ));

        return saved;
    }

    @Cacheable(value = CACHE_NAME, key = "#id")
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + id));
    }

    @Cacheable(value = CACHE_NAME, key = "#orderNumber")
    @Transactional(readOnly = true)
    public Order getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderNumber));
    }

    @Transactional(readOnly = true)
    public Page<Order> getOrdersByCustomer(String customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    @CacheEvict(value = CACHE_NAME, key = "#id")
    @Transactional
    public Order updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + id));

        OrderStatus previous = order.getStatus();
        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);

        log.info("Order {} status changed: {} -> {}", order.getOrderNumber(), previous, newStatus);

        kafkaTemplate.send(ORDER_TOPIC, updated.getOrderNumber(),
                Map.of(
                    "event", "ORDER_STATUS_UPDATED",
                    "orderNumber", updated.getOrderNumber(),
                    "customerId", updated.getCustomerId(),
                    "customerEmail", updated.getCustomerEmail(),
                    "previousStatus", previous.name(),
                    "newStatus", newStatus.name(),
                    "timestamp", LocalDateTime.now().toString()
                ));

        return updated;
    }

    @CacheEvict(value = CACHE_NAME, key = "#id")
    @Transactional
    public void cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + id));

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel order in status: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        kafkaTemplate.send(ORDER_TOPIC, order.getOrderNumber(),
                Map.of(
                    "event", "ORDER_CANCELLED",
                    "orderNumber", order.getOrderNumber(),
                    "customerEmail", order.getCustomerEmail(),
                    "timestamp", LocalDateTime.now().toString()
                ));
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000);
    }

    // Used internally by service layer — not exposed via constructor injection issues
    public record OrderItemRequest(
        String productId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice
    ) {}
}
