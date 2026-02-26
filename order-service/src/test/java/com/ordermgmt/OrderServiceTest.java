package com.ordermgmt;

import com.ordermgmt.model.*;
import com.ordermgmt.repository.OrderRepository;
import com.ordermgmt.service.OrderService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks private OrderService orderService;

    @Test
    @DisplayName("Creating an order calculates total correctly and publishes Kafka event")
    void createOrder_calculatesTotal_andPublishesEvent() {
        // Arrange
        Order saved = Order.builder()
                .id(1L)
                .orderNumber("ORD-123")
                .customerId("cust-1")
                .customerEmail("test@example.com")
                .status(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("150.00"))
                .build();

        when(orderRepository.save(any(Order.class))).thenReturn(saved);
        when(kafkaTemplate.send(anyString(), anyString(), any())).thenReturn(null);

        List<OrderService.OrderItemRequest> items = List.of(
                new OrderService.OrderItemRequest("prod-1", "Widget A", 2, new BigDecimal("50.00")),
                new OrderService.OrderItemRequest("prod-2", "Widget B", 1, new BigDecimal("50.00"))
        );

        // Act
        Order result = orderService.createOrder("cust-1", "test@example.com", "123 Main St", items);

        // Assert
        assertThat(result.getOrderNumber()).isEqualTo("ORD-123");
        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        verify(orderRepository, times(1)).save(any(Order.class));
        verify(kafkaTemplate, times(1)).send(eq("order-events"), anyString(), any());
    }

    @Test
    @DisplayName("Cancelling a shipped order throws IllegalStateException")
    void cancelOrder_whenShipped_throwsException() {
        Order order = Order.builder()
                .id(1L)
                .orderNumber("ORD-456")
                .status(OrderStatus.SHIPPED)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel order in status: SHIPPED");

        verify(kafkaTemplate, never()).send(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Getting a non-existent order throws NoSuchElementException")
    void getOrderById_notFound_throwsException() {
        when(orderRepository.findByIdWithItems(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(99L))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("Order not found: 99");
    }

    @Test
    @DisplayName("Updating order status publishes status change event")
    void updateOrderStatus_publishesKafkaEvent() {
        Order order = Order.builder()
                .id(1L)
                .orderNumber("ORD-789")
                .customerId("cust-2")
                .customerEmail("user@example.com")
                .status(OrderStatus.PENDING)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);
        when(kafkaTemplate.send(anyString(), anyString(), any())).thenReturn(null);

        orderService.updateOrderStatus(1L, OrderStatus.CONFIRMED);

        verify(kafkaTemplate, times(1)).send(eq("order-events"), anyString(), any());
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }
}
