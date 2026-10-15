package com.miapp.backend.auth;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
class AccountController {

	private final AccountService accounts;
	private final RefreshTokenCookie refreshCookie;

	/** Borra la cuenta del usuario actual y la cookie de sesión de este navegador. */
	@DeleteMapping("/api/me")
	ResponseEntity<Void> deleteAccount(@CurrentUserId UUID userId, @Valid @RequestBody DeleteAccountRequest request) {
		accounts.delete(userId, request.password());
		return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, refreshCookie.clear().toString()).build();
	}

}
