package com.miapp.backend.auth;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Cookie del refresh token:
 * - HttpOnly: JavaScript no puede leerla (protege frente a XSS).
 * - Secure: solo viaja por HTTPS (los navegadores aceptan http://localhost como excepción).
 * - SameSite=Strict: el navegador no la envía en peticiones que vengan de otra web (CSRF).
 * - Path=/api/auth: solo se envía a los endpoints de auth, no en cada petición a la API.
 */
@Component
@RequiredArgsConstructor
class RefreshTokenCookie {

	static final String NAME = "refresh_token";

	private final AuthProperties props;

	ResponseCookie create(String rawToken) {
		return builder(rawToken).maxAge(props.refreshTokenTtl()).build();
	}

	/** Max-Age=0 hace que el navegador la borre. */
	ResponseCookie clear() {
		return builder("").maxAge(0).build();
	}

	private ResponseCookie.ResponseCookieBuilder builder(String value) {
		return ResponseCookie.from(NAME, value)
			.httpOnly(true)
			.secure(props.cookieSecure())
			.sameSite("Strict")
			.path("/api/auth");
	}

}
