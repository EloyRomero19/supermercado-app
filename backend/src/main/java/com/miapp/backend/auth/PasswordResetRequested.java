package com.miapp.backend.auth;

/** Hay que enviar un enlace para restablecer la contraseña (lo hace PasswordResetMailer tras el commit). */
record PasswordResetRequested(String email, String displayName, String link) {
}
