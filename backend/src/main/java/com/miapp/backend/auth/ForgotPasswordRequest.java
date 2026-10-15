package com.miapp.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record ForgotPasswordRequest(
		@NotBlank(message = "El email es obligatorio")
		@Email(message = "El email no es válido")
		@Size(max = 254, message = "El email es demasiado largo")
		String email) {
}
