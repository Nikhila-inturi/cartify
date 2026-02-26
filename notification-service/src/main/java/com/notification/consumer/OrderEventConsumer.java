package com.notification.consumer;

import com.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(
        topics = "order-events",
        groupId = "notification-service-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOrderEvent(
            @Payload Map<String, Object> event,
            @Header(KafkaHeaders.RECEIVED_KEY) String orderNumber,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        String eventType = (String) event.get("event");
        log.info("Received event: {} for order: {} [partition={}, offset={}]",
                eventType, orderNumber, partition, offset);

        try {
            switch (eventType) {
                case "ORDER_CREATED"        -> notificationService.sendOrderConfirmation(event);
                case "ORDER_STATUS_UPDATED" -> notificationService.sendStatusUpdate(event);
                case "ORDER_CANCELLED"      -> notificationService.sendCancellationNotice(event);
                default -> log.warn("Unknown event type: {}", eventType);
            }
        } catch (Exception e) {
            // In production: send to dead-letter topic
            log.error("Failed to process event {} for order {}: {}", eventType, orderNumber, e.getMessage());
        }
    }
}
