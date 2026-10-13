package com.miapp.backend.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Convierte las excepciones en respuestas ProblemDetail (RFC 9457):
 * {@code {"status": 409, "title": "Conflict", "detail": "...", "instance": "/api/..."}}.
 * Extender {@link ResponseEntityExceptionHandler} cubre los errores propios de Spring MVC
 * (JSON mal formado, método no permitido, etc.).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(ApiException.class)
	ProblemDetail handleApiException(ApiException ex) {
		return ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
	}

	/** Dos personas modificaron lo mismo a la vez (ver @Version en ListItem): gana la primera. */
	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	ProblemDetail handleOptimisticLock() {
		return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
				"Otro miembro acaba de cambiar este producto. Vuelve a intentarlo.");
	}

	/** Errores de Bean Validation: añade {@code errors: {campo: mensaje}} para que el frontend los pinte. */
	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors()
			.forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

		ProblemDetail problem = ex.getBody();
		problem.setDetail("Hay campos no válidos");
		problem.setProperty("errors", errors);
		return handleExceptionInternal(ex, problem, headers, status, request);
	}

}
