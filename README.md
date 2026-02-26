# Cartify

A production-style **full-stack e-commerce backend** built with microservices — handles everything from the moment a customer places an order to the last-mile delivery notification. Built to demonstrate real patterns used in e-commerce platforms: event-driven order pipelines, distributed caching, async notifications, and a React dashboard for order operations.

---

## What This System Does

A customer places an order on the storefront. That order flows through the system like this:

```
Customer places order
        │
        ▼
  Order Service  ──── saves to PostgreSQL
        │         ──── caches in Redis (10-min TTL)
        │         ──── publishes Kafka event: ORDER_CREATED
        │
        ▼
 Notification Service (Kafka consumer)
        │
        ├── sends order confirmation email to customer
        ├── alerts warehouse team to start picking
        └── logs event for analytics pipeline

Staff updates status: CONFIRMED → PROCESSING → SHIPPED → DELIVERED
        │
        ▼
 Kafka event: ORDER_STATUS_UPDATED
        │
        ▼
 Notification Service sends shipping update to customer
```

The React dashboard lets operations staff view all orders, drill into line items, advance order status, and cancel orders.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  React 18 Dashboard  :3000               │
│         Redux Toolkit  ·  Axios  ·  CSS Grid             │
└─────────────────────────┬────────────────────────────────┘
                          │ REST / JSON
                          ▼
┌──────────────────────────────────────────────────────────┐
│              API Gateway  :8080                          │
│   Spring Cloud Gateway  ·  JWT Validation  ·  CORS       │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐     ┌────────────────────┐
│     Order Service  :8081     │────▶│   Apache Kafka     │
│                              │     │  order-events      │
│  Spring Boot 3  ·  Java 21   │     └────────┬───────────┘
│  PostgreSQL  ·  Flyway       │              │
│  Redis (cache-aside, TTL)    │              ▼
│  OpenAPI 3.0 / Swagger UI    │     ┌────────────────────┐
└──────────────────────────────┘     │ Notification Svc   │
                                     │  :8082             │
                                     │  Kafka Consumer    │
                                     │  Order confirmations│
                                     │  Shipping updates  │
                                     └────────────────────┘
```

---

## Order Lifecycle

```
PENDING ──▶ CONFIRMED ──▶ PROCESSING ──▶ SHIPPED ──▶ DELIVERED
   │              │              │
   └──────────────┴──────────────┴──────────────────▶ CANCELLED
```

Every status transition fires a Kafka event. The notification service consumes each event and dispatches the appropriate customer communication.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | Java 21 (Records, Virtual Threads) | Latest LTS — cleaner code, better concurrency |
| Backend | Spring Boot 3.2, Spring Cloud | Industry standard for microservices |
| Messaging | Apache Kafka | Decouples order processing from notifications — a lost event doesn't lose a customer |
| Cache | Redis (cache-aside, 10-min TTL) | Cuts DB reads on high-traffic order lookup endpoints |
| Database | PostgreSQL 15, Flyway | ACID transactions for order data; migrations version-controlled |
| Security | Spring Security, JWT | Stateless auth — scales horizontally without session state |
| API Docs | OpenAPI 3.0 / Swagger UI | Self-documenting APIs at `/swagger-ui.html` |
| Frontend | React 18, Redux Toolkit | Hooks + async thunks keep the dashboard state clean |
| Gateway | Spring Cloud Gateway | Single entry point — JWT validation happens once, not in every service |
| Containers | Docker, Docker Compose | Full stack runs with one command |
| CI/CD | GitHub Actions | Tests run on every push; Docker images built on merge to main |
| Testing | JUnit 5, Mockito | Unit tests cover service layer, including Kafka publish verification |

---

## Getting Started

### One-command setup (Docker)

```bash
git clone https://github.com/yourusername/order-management-system.git
cd order-management-system
docker-compose up --build
```

That's it. Docker pulls Postgres, Redis, Kafka, Zookeeper, builds all four services, and starts everything.

| What | URL |
|---|---|
| Order Dashboard (React) | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Order Service API | http://localhost:8081 |
| Swagger UI | http://localhost:8081/swagger-ui.html |
| Notification Service | http://localhost:8082 |

> First build takes ~3–4 minutes while Maven downloads dependencies. After that, `docker-compose up` starts in under 30 seconds.

---

### Local development (without Docker)

Start just the infrastructure:

```bash
docker-compose up -d postgres redis zookeeper kafka
```

Then run each service:

```bash
# Terminal 1 — Order Service
cd order-service && mvn spring-boot:run

# Terminal 2 — Notification Service
cd notification-service && mvn spring-boot:run

# Terminal 3 — API Gateway
cd api-gateway && mvn spring-boot:run

# Terminal 4 — Frontend
cd frontend && npm install && npm start
```

---

## API Reference

All requests route through the **API Gateway on port 8080**. Full interactive docs at `http://localhost:8081/swagger-ui.html`.

### Order Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/orders` | Place a new order |
| `GET` | `/api/v1/orders` | List all orders (paginated, sortable) |
| `GET` | `/api/v1/orders/{id}` | Get order with line items |
| `GET` | `/api/v1/orders/number/{orderNumber}` | Lookup by order number |
| `GET` | `/api/v1/orders/customer/{customerId}` | All orders for a customer |
| `PATCH` | `/api/v1/orders/{id}/status` | Advance order status |
| `DELETE` | `/api/v1/orders/{id}` | Cancel an order |

### Place an Order

```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "customerId": "cust-001",
    "customerEmail": "jane@example.com",
    "shippingAddress": "123 Main St, Dallas, TX 75201",
    "items": [
      {
        "productId": "SKU-WK-001",
        "productName": "Mechanical Keyboard",
        "quantity": 1,
        "unitPrice": 129.99
      },
      {
        "productId": "SKU-MS-042",
        "productName": "Wireless Mouse",
        "quantity": 2,
        "unitPrice": 39.99
      }
    ]
  }'
```

**Response:**
```json
{
  "id": 1,
  "orderNumber": "ORD-1708956000000-423",
  "customerId": "cust-001",
  "customerEmail": "jane@example.com",
  "status": "PENDING",
  "totalAmount": 209.97,
  "items": [
    { "productName": "Mechanical Keyboard", "quantity": 1, "unitPrice": 129.99, "subtotal": 129.99 },
    { "productName": "Wireless Mouse", "quantity": 2, "unitPrice": 39.99, "subtotal": 79.98 }
  ],
  "createdAt": "2024-02-26T10:30:00"
}
```

### Update Order Status

```bash
curl -X PATCH http://localhost:8080/api/v1/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status": "CONFIRMED"}'
```

---

## Kafka Events

Every order state change publishes a message to the `order-events` topic.

| Event | Trigger | What the notification service does |
|---|---|---|
| `ORDER_CREATED` | New order placed | Sends order confirmation email to customer |
| `ORDER_STATUS_UPDATED` | Status changed | Sends shipping update or status notification |
| `ORDER_CANCELLED` | Order cancelled | Sends cancellation confirmation |

**Why Kafka and not a direct service call?**

If the notification service is down when an order is placed, the order still goes through — the event sits in Kafka and gets processed when the service comes back up. A direct HTTP call would either block the order or silently drop the notification. For e-commerce, a missed confirmation email is a bad customer experience. A failed order is worse.

---

## Caching Strategy

Order reads use the **cache-aside pattern** with Redis:

```
Request for order ID 42
    │
    ├── Cache hit?  → return from Redis immediately
    └── Cache miss  → query PostgreSQL → store in Redis (TTL: 10 min) → return
```

Status updates and cancellations evict the cache entry immediately (`@CacheEvict`). This is the right pattern for the "order status" page — one of the most hit endpoints after a customer places an order, especially during peak periods like flash sales.

---

## Database Design

```sql
orders
  id · order_number (unique) · customer_id · customer_email
  status · total_amount · shipping_address · created_at · updated_at

order_items
  id · order_id (FK → orders) · product_id · product_name
  quantity · unit_price · subtotal
```

**Indexes added:**
- `customer_id` — fast order history by customer
- `status` — operations dashboard filtering
- `created_at DESC` — recent orders listing
- `order_id` on items — avoids full scan on line item fetch

All item queries use `JOIN FETCH` to load orders with their items in a single query — no N+1.

---

## Running Tests

```bash
cd order-service
mvn test
```

Tests cover:
- Order creation calculates line item totals correctly
- Kafka event is published when an order is created
- Cancelling a shipped order throws `IllegalStateException`
- Status update publishes a `ORDER_STATUS_UPDATED` Kafka event
- Non-existent order lookup throws `NoSuchElementException`

---

## Project Structure

```
order-management-system/
├── .github/workflows/ci.yml         # CI: tests on push, Docker build on main
├── order-service/                   # Core order API
│   ├── controller/                  # REST endpoints (OpenAPI annotated)
│   ├── service/                     # Business logic, Kafka publishing, Redis caching
│   ├── repository/                  # JPA with JOIN FETCH (no N+1)
│   ├── model/                       # Order, OrderItem, OrderStatus
│   ├── config/                      # Security, Kafka producer, Redis config
│   └── db/migration/                # Flyway SQL migrations
├── notification-service/            # Kafka consumer — processes all order events
├── api-gateway/                     # Spring Cloud Gateway + JWT filter
├── frontend/                        # React 18 dashboard
│   ├── components/Dashboard/        # Status summary cards
│   ├── components/OrderList/        # Paginated table with status controls
│   ├── components/OrderForm/        # Create order with dynamic line items
│   └── store/slices/                # Redux Toolkit (orders, auth)
└── docker-compose.yml               # Full stack: PostgreSQL, Redis, Kafka + all services
```

---

## What I'd Add Next

- **Inventory service** — reserve stock on CONFIRMED, release on CANCELLED
- **Payment service** — Stripe integration, payment status in order lifecycle  
- **Elasticsearch** — search across order history by product name or customer
- **Outbox pattern** — guarantee Kafka events survive a mid-transaction service crash
- **Kubernetes manifests** — Helm charts for EKS deployment

---

