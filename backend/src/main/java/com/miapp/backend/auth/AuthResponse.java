package com.miapp.backend.auth;

import com.miapp.backend.user.UserDto;

/** Cuerpo de las respuestas de login/registro/refresh. El refresh token va aparte, en la cookie. */
record AuthResponse(String accessToken, long expiresIn, UserDto user) {
}
