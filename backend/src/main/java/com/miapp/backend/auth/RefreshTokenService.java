package com.miapp.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.user.AppUser;

import lombok.RequiredArgsConstructor;

/**
 * Refresh tokens opacos (256 bits aleatorios) con rotación: cada uso devuelve uno nuevo y
 * revoca el anterior. Si alguien presenta un token ya revocado, es que se ha copiado
 * (lo tienen dos personas): se revoca toda la familia y ambos tendrán que volver a entrar.
 * Los métodos se ejecutan dentro de la transacción de AuthService.
 */
@Service
@RequiredArgsConstructor
class RefreshTokenService {

	private static final SecureRandom RANDOM = new SecureRandom();

	private final RefreshTokenRepository tokens;
	private final AuthProperties props;

	/** Crea un token para la familia indicada y devuelve el valor en claro (solo viaja en la cookie). */
	String issue(AppUser user, UUID familyId) {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		tokens.save(new RefreshToken(user, hash(rawToken), familyId, Instant.now().plus(props.refreshTokenTtl())));
		return rawToken;
	}

	/** Valida el token y lo marca como usado. Quien llama debe emitir el siguiente de la misma familia. */
	RefreshToken consume(String rawToken) {
		RefreshToken token = tokens.findByTokenHash(hash(rawToken)).orElseThrow(RefreshTokenService::invalidSession);
		Instant now = Instant.now();
		if (token.getRevokedAt() != null) {
			tokens.revokeFamily(token.getFamilyId(), now);
			throw invalidSession();
		}
		if (token.getExpiresAt().isBefore(now)) {
			throw invalidSession();
		}
		token.setRevokedAt(now);
		return token;
	}

	void revokeFamilyOf(String rawToken) {
		tokens.findByTokenHash(hash(rawToken))
			.ifPresent(token -> tokens.revokeFamily(token.getFamilyId(), Instant.now()));
	}

	/** Solo guardamos el SHA-256: si roban la BD, los hashes no sirven para iniciar sesión. */
	private static String hash(String rawToken) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex); // SHA-256 existe siempre en la JVM
		}
	}

	static ApiException invalidSession() {
		return new ApiException(HttpStatus.UNAUTHORIZED, "La sesión ha caducado. Vuelve a iniciar sesión");
	}

}
