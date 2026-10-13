package com.miapp.backend.user;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miapp.backend.auth.CurrentUserId;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
class MeController {

	private final UserService userService;

	/** Spring ya validó el JWT antes de llegar aquí. */
	@GetMapping("/api/me")
	UserDto me(@CurrentUserId UUID userId) {
		return userService.getById(userId);
	}

}
