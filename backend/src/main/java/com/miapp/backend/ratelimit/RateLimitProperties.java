package com.miapp.backend.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** app.rate-limit.enabled: se desactiva en los tests, que hacen cientos de registros seguidos. */
@ConfigurationProperties("app.rate-limit")
record RateLimitProperties(boolean enabled) {
}
