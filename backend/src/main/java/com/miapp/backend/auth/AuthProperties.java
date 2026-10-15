package com.miapp.backend.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propiedades {@code app.auth.*} de application.yml, enlazadas a un record con tipos reales (Duration, boolean...). */
@ConfigurationProperties("app.auth")
public record AuthProperties(
		String jwtSecret,
		String issuer,
		Duration accessTokenTtl,
		Duration refreshTokenTtl,
		boolean cookieSecure,
		String frontendUrl) {
}
