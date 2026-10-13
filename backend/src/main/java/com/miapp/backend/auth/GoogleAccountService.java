package com.miapp.backend.auth;

import java.time.Instant;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.user.AppUser;
import com.miapp.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

/** Decide qué usuario corresponde a un login con Google. Se ejecuta dentro de la transacción de AuthService. */
@Service
@RequiredArgsConstructor
class GoogleAccountService {

	private final UserRepository users;
	private final RefreshTokenRepository refreshTokens;

	AppUser findOrCreate(GoogleProfile profile) {
		// 1. Ya entró antes con Google. Se busca por "sub" (id de Google, nunca cambia), no por email.
		var bySub = users.findByGoogleSub(profile.sub());
		if (bySub.isPresent()) {
			return bySub.get();
		}

		if (profile.email() == null || profile.email().isBlank()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Google no ha proporcionado un email");
		}
		String email = profile.email().trim().toLowerCase(Locale.ROOT);

		// 2. Existe una cuenta con contraseña y el mismo email: se enlaza solo si Google lo ha verificado
		var byEmail = users.findByEmailIgnoreCase(email);
		if (byEmail.isPresent()) {
			if (!profile.emailVerified()) {
				throw new ApiException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email");
			}
			return link(byEmail.get(), profile);
		}

		// 3. Usuario nuevo, sin contraseña
		return users.saveAndFlush(AppUser.fromGoogle(email, displayName(profile, email), profile.sub(), avatar(profile)));
	}

	/**
	 * Nosotros nunca comprobamos que quien se registra con contraseña sea el dueño del email;
	 * Google sí. Si alguien creó la cuenta con un email ajeno antes que su dueño (ataque de
	 * "pre-registro"), conservaría el acceso con su contraseña tras el enlace. Por eso, al
	 * enlazar, se anulan la contraseña y las sesiones abiertas: la cuenta queda en manos de quien
	 * ha demostrado controlar el email.
	 */
	private AppUser link(AppUser user, GoogleProfile profile) {
		user.setGoogleSub(profile.sub());
		if (user.getAvatarUrl() == null) {
			user.setAvatarUrl(avatar(profile));
		}
		if (user.getPasswordHash() != null) {
			user.setPasswordHash(null);
			refreshTokens.revokeAllForUser(user.getId(), Instant.now());
		}
		return user;
	}

	private static String displayName(GoogleProfile profile, String email) {
		String name = profile.name() == null || profile.name().isBlank() ? email.substring(0, email.indexOf('@')) : profile.name().trim();
		return name.length() > 100 ? name.substring(0, 100) : name;
	}

	private static String avatar(GoogleProfile profile) {
		return profile.picture() != null && profile.picture().length() <= 500 ? profile.picture() : null;
	}

}
