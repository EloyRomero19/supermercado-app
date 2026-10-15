package com.miapp.backend.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.user.AppUser;
import com.miapp.backend.user.UserDto;
import com.miapp.backend.user.UserRepository;

@Service
class AuthService {

	/** Resultado interno: el controlador pone el refresh token en la cookie y el resto en el cuerpo. */
	record AuthResult(String accessToken, String refreshToken, UserDto user) {
	}

	private static final int BCRYPT_MAX_BYTES = 72;

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final AccessTokenService accessTokens;
	private final RefreshTokenService refreshTokens;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordResetService passwordResets;

	/** Hash de una contraseña cualquiera, para comparar contra algo cuando el email no existe. */
	private final String dummyPasswordHash;

	AuthService(UserRepository users, PasswordEncoder passwordEncoder, AccessTokenService accessTokens,
			RefreshTokenService refreshTokens, RefreshTokenRepository refreshTokenRepository,
			PasswordResetService passwordResets) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.accessTokens = accessTokens;
		this.refreshTokens = refreshTokens;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordResets = passwordResets;
		this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	@Transactional
	AuthResult register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		requireBcryptLength(request.password());
		if (users.findByEmailIgnoreCase(email).isPresent()) {
			throw emailAlreadyUsed();
		}

		AppUser user = new AppUser(email, request.displayName().trim(), passwordEncoder.encode(request.password()));
		try {
			// flush inmediato: si otro registro con el mismo email se coló entre la comprobación
			// de arriba y este insert, el índice único salta aquí y lo convertimos en un 409
			users.saveAndFlush(user);
		}
		catch (DataIntegrityViolationException ex) {
			throw emailAlreadyUsed();
		}
		return startSession(user, UUID.randomUUID());
	}

	@Transactional
	AuthResult login(LoginRequest request) {
		AppUser user = users.findByEmailIgnoreCase(normalizeEmail(request.email())).orElse(null);
		boolean hasPassword = user != null && user.getPasswordHash() != null;

		// Siempre ejecutamos BCrypt (unos 100 ms), exista el usuario o no. Si solo lo hiciéramos
		// cuando existe, midiendo el tiempo de respuesta se podría averiguar qué emails están registrados.
		boolean passwordMatches = byteLength(request.password()) <= BCRYPT_MAX_BYTES
				&& passwordEncoder.matches(request.password(), hasPassword ? user.getPasswordHash() : dummyPasswordHash);

		if (!hasPassword || !passwordMatches) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos");
		}
		return startSession(user, UUID.randomUUID());
	}

	/**
	 * Contraseña nueva con un enlace del email. Se cierran todas las sesiones abiertas (si alguien
	 * te la había robado, deja de tener acceso) y se abre una nueva en este dispositivo.
	 * Sirve también para quien entraba con Google y no tenía contraseña.
	 */
	@Transactional
	AuthResult resetPassword(ResetPasswordRequest request) {
		requireBcryptLength(request.password());
		AppUser user = passwordResets.consume(request.token());
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		refreshTokenRepository.revokeAllForUser(user.getId(), Instant.now());
		return startSession(user, UUID.randomUUID());
	}

	/**
	 * noRollbackFor: si se detecta un token reutilizado, RefreshTokenService revoca la familia
	 * y lanza ApiException. Sin esto, la excepción desharía también la revocación.
	 */
	@Transactional(noRollbackFor = ApiException.class)
	AuthResult refresh(String rawRefreshToken) {
		RefreshToken used = refreshTokens.consume(rawRefreshToken);
		return startSession(used.getUser(), used.getFamilyId());
	}

	@Transactional
	void logout(String rawRefreshToken) {
		refreshTokens.revokeFamilyOf(rawRefreshToken);
	}

	private AuthResult startSession(AppUser user, UUID familyId) {
		String refreshToken = refreshTokens.issue(user, familyId);
		return new AuthResult(accessTokens.create(user), refreshToken, UserDto.from(user));
	}

	private static String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	/** @Size cuenta caracteres, pero BCrypt cuenta bytes: "ñ" ocupa 2 en UTF-8. */
	private static void requireBcryptLength(String password) {
		if (byteLength(password) > BCRYPT_MAX_BYTES) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña es demasiado larga");
		}
	}

	private static int byteLength(String password) {
		return password.getBytes(StandardCharsets.UTF_8).length;
	}

	private static ApiException emailAlreadyUsed() {
		return new ApiException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email");
	}

}
