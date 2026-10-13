package com.miapp.backend.auth;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * Inyecta el id del usuario autenticado en un parámetro de controlador: {@code @CurrentUserId UUID userId}.
 * Es una meta-anotación: Spring la trata como @AuthenticationPrincipal y evalúa la expresión
 * sobre el Jwt ya validado (su claim "sub" es el id del usuario).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@AuthenticationPrincipal(expression = "T(java.util.UUID).fromString(subject)")
public @interface CurrentUserId {
}
