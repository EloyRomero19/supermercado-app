package com.miapp.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.user.AppUser;
import com.miapp.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * "¿Has olvidado tu contraseña?": se envía por email un enlace de un solo uso y de vida corta.
 * Abrirlo demuestra que controlas ese email, y con eso basta para elegir una contraseña nueva.
 */
@Service
@RequiredArgsConstructor
class PasswordResetService {

	/** Máximo de enlaces por cuenta y hora: que nadie pueda llenar el buzón de otra persona. */
	static final int MAX_LINKS_PER_HOUR = 3;

	private final UserRepository users;
	private final PasswordResetTokenRepository tokens;
	private final AuthProperties props;
	private final ApplicationEventPublisher events;

	/**
	 * Si hay una cuenta con ese email, crea un enlace y pide que se envíe. Si no la hay, no hace
	 * nada, y el controlador responde igual en los dos casos: así no se puede averiguar qué
	 * emails están registrados. El correo sale en otro hilo después del commit
	 * (PasswordResetMailer), así que el tiempo de respuesta tampoco lo delata.
	 */
	@Transactional
	void requestLink(String email) {
		users.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT)).ifPresent(user -> {
			Instant now = Instant.now();
			if (tokens.countByUserIdAndCreatedAtAfter(user.getId(), now.minus(Duration.ofHours(1))) >= MAX_LINKS_PER_HOUR) {
				return;
			}
			String rawToken = SecureTokens.generate();
			tokens.save(new PasswordResetToken(user, SecureTokens.hash(rawToken), now.plus(props.passwordResetTtl())));
			// El token va en el fragmento (#): el navegador no lo envía al servidor ni en la cabecera Referer
			String link = props.frontendUrl() + "/restablecer#" + rawToken;
			events.publishEvent(new PasswordResetRequested(user.getEmail(), user.getDisplayName(), link));
		});
	}

	/**
	 * Comprueba el enlace y lo gasta, junto con cualquier otro pendiente de la misma cuenta.
	 * Se ejecuta dentro de la transacción de AuthService, que después cambia la contraseña.
	 */
	AppUser consume(String rawToken) {
		PasswordResetToken token = tokens.findByTokenHash(SecureTokens.hash(rawToken))
			.orElseThrow(PasswordResetService::invalidLink);
		Instant now = Instant.now();
		if (token.getUsedAt() != null || token.getExpiresAt().isBefore(now)) {
			throw invalidLink();
		}
		tokens.invalidateAllForUser(token.getUser().getId(), now);
		return token.getUser();
	}

	private static ApiException invalidLink() {
		return new ApiException(HttpStatus.BAD_REQUEST, "El enlace no es válido o ha caducado. Pide uno nuevo");
	}

}
