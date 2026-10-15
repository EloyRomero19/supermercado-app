package com.miapp.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record ResetPasswordRequest(
		@NotBlank(message = "Falta el código del enlace")
		@Size(max = 100, message = "El enlace no es válido")
		String token,

		@NotBlank(message = "La contraseña es obligatoria")
		@Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
		String password) {
}
