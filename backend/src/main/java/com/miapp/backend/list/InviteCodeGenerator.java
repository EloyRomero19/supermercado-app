package com.miapp.backend.list;

import java.security.SecureRandom;
import java.util.Locale;

import org.springframework.stereotype.Component;

/**
 * Códigos de invitación de 8 caracteres, p. ej. "K7MX4QPA".
 * El alfabeto quita los caracteres que se confunden al leerlos o dictarlos (0/O, 1/I/L, U/V).
 * 29 símbolos ^ 8 posiciones ≈ 500 000 millones de combinaciones: imposible acertar uno
 * al azar (y en la Fase 10 limitaremos los intentos).
 */
@Component
class InviteCodeGenerator {

	private static final String ALPHABET = "23456789ABCDEFGHJKMNPQRSTWXYZ";
	private static final int LENGTH = 8;

	// SecureRandom, no Random: los valores de Random se pueden predecir a partir de otros anteriores
	private final SecureRandom random = new SecureRandom();

	String generate() {
		StringBuilder code = new StringBuilder(LENGTH);
		for (int i = 0; i < LENGTH; i++) {
			code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
		}
		return code.toString();
	}

	/** Acepta lo que escriba el usuario: " k7mx-4qpa " → "K7MX4QPA". */
	static String normalize(String input) {
		return input.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
	}

}
