package com.gateway.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    // Paths that bypass JWT validation
    private static final List<String> OPEN_PATHS = List.of(
            "/api/v1/auth/",
            "/actuator/",
            "/swagger-ui",
            "/v3/api-docs",
            "/api/v1/orders/health"
    );

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getPath().toString();

            // Skip auth for open paths
            boolean isOpen = OPEN_PATHS.stream().anyMatch(path::startsWith);
            if (isOpen) return chain.filter(exchange);

            String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return unauthorised(exchange);
            }

            String token = authHeader.substring(7);
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parser().verifyWith(key).build()
                        .parseSignedClaims(token).getPayload();

                // Forward the subject downstream so services don't re-validate
                ServerWebExchange mutated = exchange.mutate()
                        .request(r -> r.header("X-User-Id", claims.getSubject()))
                        .build();
                return chain.filter(mutated);

            } catch (JwtException e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                return unauthorised(exchange);
            }
        };
    }

    private Mono<Void> unauthorised(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config {}
}
