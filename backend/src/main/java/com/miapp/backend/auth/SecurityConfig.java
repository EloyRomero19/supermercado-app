package com.miapp.backend.auth;

import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {

	/**
	 * API sin estado: cada petición se autentica con "Authorization: Bearer <jwt>".
	 * - Sin sesión HTTP ni formulario de login.
	 * - CSRF desactivado: el navegador no añade la cabecera Authorization por su cuenta,
	 *   así que otra web no puede hacer peticiones autenticadas en tu nombre.
	 *   (Los endpoints que usan la cookie de refresh se protegen aparte en AuthController.)
	 */
	@Bean
	SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login",
						"/api/auth/refresh", "/api/auth/logout").permitAll()
				.requestMatchers("/error").permitAll()
				// Para el healthcheck de Docker; solo dice {"status":"UP"}, sin detalles internos
				.requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
				.anyRequest().authenticated())
			// Valida el JWT con el JwtDecoder de abajo; si falla responde 401
			.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
		return http.build();
	}

	/** Hashes "{bcrypt}$2a$10$...": el prefijo permite cambiar de algoritmo en el futuro sin romper los antiguos. */
	@Bean
	PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

	@Bean
	JwtEncoder jwtEncoder(AuthProperties props) {
		return NimbusJwtEncoder.withSecretKey(signingKey(props)).algorithm(MacAlgorithm.HS256).build();
	}

	/** Comprueba firma, caducidad (exp) y que el emisor (iss) sea el nuestro. */
	@Bean
	JwtDecoder jwtDecoder(AuthProperties props) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(signingKey(props))
			.macAlgorithm(MacAlgorithm.HS256)
			.build();
		decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(props.issuer()));
		return decoder;
	}

	private static SecretKey signingKey(AuthProperties props) {
		if (props.jwtSecret() == null || props.jwtSecret().isBlank()) {
			throw new IllegalStateException("Falta JWT_SECRET (genéralo con: openssl rand -base64 48)");
		}
		byte[] bytes = Base64.getDecoder().decode(props.jwtSecret().trim());
		if (bytes.length < 32) {
			throw new IllegalStateException("JWT_SECRET debe tener al menos 256 bits (32 bytes)");
		}
		return new SecretKeySpec(bytes, "HmacSHA256");
	}

}
