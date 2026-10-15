package com.miapp.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Tokens opacos (refresh token y enlace para restablecer la contraseña): 256 bits aleatorios.
 * En la base de datos solo se guarda su SHA-256: si alguien la robara, no le servirían de nada.
 * (Un hash rápido basta aquí, a diferencia de las contraseñas: 256 bits aleatorios no se pueden adivinar.)
 */
final class SecureTokens {

	private static final SecureRandom RANDOM = new SecureRandom();

	private SecureTokens() {
	}

	/** Valor en claro, apto para una cookie o una URL (Base64 URL-safe, sin "="). */
	static String generate() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	static String hash(String rawToken) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex); // SHA-256 existe siempre en la JVM
		}
	}

}
