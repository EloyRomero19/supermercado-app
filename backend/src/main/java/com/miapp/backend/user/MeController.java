package com.miapp.backend.user;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
class MeController {

	private final UserService userService;

	/** Spring ya validó el JWT antes de llegar aquí; "sub" contiene el id del usuario. */
	@GetMapping("/api/me")
	UserDto me(@AuthenticationPrincipal Jwt jwt) {
		return userService.getById(UUID.fromString(jwt.getSubject()));
	}

}
