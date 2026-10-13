package com.miapp.backend.auth;

import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/** Datos que nos interesan del ID token de Google (OpenID Connect). */
record GoogleProfile(String sub, String email, boolean emailVerified, String name, String picture) {

	static GoogleProfile from(OidcUser user) {
		return new GoogleProfile(user.getSubject(), user.getEmail(), Boolean.TRUE.equals(user.getEmailVerified()),
				user.getFullName(), user.getPicture());
	}

}
