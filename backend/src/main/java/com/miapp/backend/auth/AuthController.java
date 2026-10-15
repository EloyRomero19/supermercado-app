package com.miapp.backend.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miapp.backend.auth.AuthService.AuthResult;
import com.miapp.backend.common.ApiException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {

	private final AuthService authService;
	private final RefreshTokenCookie refreshCookie;
	private final AuthProperties props;

	@PostMapping("/register")
	ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		return sessionResponse(HttpStatus.CREATED, authService.register(request));
	}

	@PostMapping("/login")
	ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		return sessionResponse(HttpStatus.OK, authService.login(request));
	}

	@PostMapping("/refresh")
	ResponseEntity<AuthResponse> refresh(
			@CookieValue(name = RefreshTokenCookie.NAME, required = false) String refreshToken,
			@RequestHeader(name = HttpHeaders.ORIGIN, required = false) String origin) {
		requireSameOrigin(origin);
		if (refreshToken == null || refreshToken.isBlank()) {
			throw RefreshTokenService.invalidSession();
		}
		return sessionResponse(HttpStatus.OK, authService.refresh(refreshToken));
	}

	@PostMapping("/logout")
	ResponseEntity<Void> logout(
			@CookieValue(name = RefreshTokenCookie.NAME, required = false) String refreshToken,
			@RequestHeader(name = HttpHeaders.ORIGIN, required = false) String origin) {
		requireSameOrigin(origin);
		if (refreshToken != null && !refreshToken.isBlank()) {
			authService.logout(refreshToken);
		}
		return ResponseEntity.noContent()
			.header(HttpHeaders.SET_COOKIE, refreshCookie.clear().toString())
			.build();
	}

	private ResponseEntity<AuthResponse> sessionResponse(HttpStatus status, AuthResult result) {
		ResponseCookie cookie = refreshCookie.create(result.refreshToken());
		AuthResponse body = new AuthResponse(result.accessToken(), props.accessTokenTtl().toSeconds(), result.user());
		return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE, cookie.toString()).body(body);
	}

	/**
	 * Segunda defensa CSRF para los endpoints que funcionan con la cookie (la primera es SameSite).
	 * Los navegadores siempre envían Origin en un POST; si viene de otra web, lo rechazamos.
	 * Sin Origin (curl, tests) no hay navegador que pueda ser engañado, así que se permite.
	 */
	private void requireSameOrigin(String origin) {
		if (origin != null && !origin.equals(props.frontendUrl())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Origen no permitido");
		}
	}

}
