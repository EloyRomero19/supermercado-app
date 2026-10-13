package com.miapp.backend.ratelimit;

import lombok.Getter;

@Getter
public class TooManyRequestsException extends RuntimeException {

	private final long retryAfterSeconds;

	TooManyRequestsException(long retryAfterSeconds) {
		super("Demasiados intentos. Espera " + retryAfterSeconds + " s y vuelve a probar.");
		this.retryAfterSeconds = retryAfterSeconds;
	}

}
