package com.miapp.backend.auth;

import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.miapp.backend.user.AppUser;

import lombok.RequiredArgsConstructor;

/** Emite el access token: un JWT firmado y de vida corta que el frontend guarda solo en memoria. */
@Service
@RequiredArgsConstructor
class AccessTokenService {

	private final JwtEncoder encoder;
	private final AuthProperties props;

	String create(AppUser user) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(props.issuer())
			.issuedAt(now)
			.expiresAt(now.plus(props.accessTokenTtl()))
			.subject(user.getId().toString())
			.claim("email", user.getEmail())
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

}
