package com.miapp.backend.auth;

import jakarta.validation.constraints.NotBlank;

record DeleteAccountRequest(@NotBlank(message = "Escribe tu contraseña") String password) {
}
