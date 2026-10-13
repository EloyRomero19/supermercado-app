package com.miapp.backend.auth;

import jakarta.validation.constraints.NotBlank;

record LoginRequest(
		@NotBlank(message = "El email es obligatorio") String email,
		@NotBlank(message = "La contraseña es obligatoria") String password) {
}
