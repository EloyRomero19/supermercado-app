package com.miapp.backend.common;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/**
 * Error de negocio con su código HTTP. El {@link GlobalExceptionHandler} lo convierte
 * en un {@code ProblemDetail}, así que el mensaje debe ser apto para mostrarse al usuario.
 */
@Getter
public class ApiException extends RuntimeException {

	private final HttpStatus status;

	public ApiException(HttpStatus status, String message) {
		super(message);
		this.status = status;
	}

}
