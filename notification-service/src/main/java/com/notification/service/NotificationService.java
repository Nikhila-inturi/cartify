package com.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * NotificationService — simulates sending emails/SMS.
 * In production: wire in SendGrid, AWS SES, or Twilio.
 */
@Service
@Slf4j
public class NotificationService {

    public void sendOrderConfirmation(Map<String, Object> event) {
        String email  = (String) event.get("customerEmail");
        String order  = (String) event.get("orderNumber");
        Object amount = event.get("totalAmount");

        // Simulate email send — replace with real provider
        log.info("[EMAIL] Order confirmation sent to {} | Order: {} | Total: ${}", email, order, amount);
    }

    public void sendStatusUpdate(Map<String, Object> event) {
        String email      = (String) event.get("customerEmail");
        String order      = (String) event.get("orderNumber");
        String newStatus  = (String) event.get("newStatus");
        String prevStatus = (String) event.get("previousStatus");

        log.info("[EMAIL] Status update sent to {} | Order: {} | {} -> {}", email, order, prevStatus, newStatus);
    }

    public void sendCancellationNotice(Map<String, Object> event) {
        String email = (String) event.get("customerEmail");
        String order = (String) event.get("orderNumber");

        log.info("[EMAIL] Cancellation notice sent to {} | Order: {}", email, order);
    }
}
