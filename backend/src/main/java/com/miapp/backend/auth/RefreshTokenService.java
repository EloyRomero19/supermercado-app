package com.miapp.backend.auth;

import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.user.AppUser;

import lombok.RequiredArgsConstructor;

/**
 * Refresh tokens opacos ({@link SecureTokens}) con rotación: cada uso devuelve uno nuevo y
 * revoca el anterior. Si alguien presenta un token ya revocado, es que se ha copiado
 * (lo tienen dos personas): se revoca toda la familia y ambos tendrán que volver a entrar.
 * Los métodos se ejecutan dentro de la transacción de AuthService.
 */
@Service
@RequiredArgsConstructor
class RefreshTokenService {

	private final RefreshTokenRepository tokens;
	private final AuthProperties props;

	/** Crea un token para la familia indicada y devuelve el valor en claro (solo viaja en la cookie). */
	String issue(AppUser user, UUID familyId) {
		String rawToken = SecureTokens.generate();
		tokens.save(new RefreshToken(user, SecureTokens.hash(rawToken), familyId, Instant.now().plus(props.refreshTokenTtl())));
		return rawToken;
	}

	/** Valida el token y lo marca como usado. Quien llama debe emitir el siguiente de la misma familia. */
	RefreshToken consume(String rawToken) {
		RefreshToken token = tokens.findByTokenHash(SecureTokens.hash(rawToken)).orElseThrow(RefreshTokenService::invalidSession);
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
		tokens.findByTokenHash(SecureTokens.hash(rawToken))
			.ifPresent(token -> tokens.revokeFamily(token.getFamilyId(), Instant.now()));
	}

	static ApiException invalidSession() {
		return new ApiException(HttpStatus.UNAUTHORIZED, "La sesión ha caducado. Vuelve a iniciar sesión");
	}

}
