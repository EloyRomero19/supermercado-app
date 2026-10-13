package com.miapp.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestcontainersConfiguration;

import jakarta.servlet.http.Cookie;

/**
 * El viaje real a Google no se puede automatizar, así que probamos las dos mitades:
 * la redirección inicial y lo que ocurre cuando Spring ya ha validado la respuesta de Google
 * (llamando al success handler con un usuario de Google fabricado).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GoogleLoginTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	GoogleLoginSuccessHandler successHandler;

	@Autowired
	AuthProperties props;

	@Test
	void authorizationRedirectsToGoogle() throws Exception {
		MvcResult result = mvc.perform(get("/oauth2/authorization/google"))
			.andExpect(status().is3xxRedirection())
			.andReturn();

		assertThat(result.getResponse().getRedirectedUrl())
			.startsWith("https://accounts.google.com/o/oauth2/v2/auth")
			.contains("client_id=", "state=", "scope=openid%20email%20profile", "login/oauth2/code/google");
	}

	@Test
	void newGoogleUserIsCreatedAndGetsASession() throws Exception {
		String email = randomEmail();

		MockHttpServletResponse response = googleLogin(UUID.randomUUID().toString(), email, true);

		assertThat(response.getRedirectedUrl()).isEqualTo(props.frontendUrl() + "/auth/callback");
		mvc.perform(post("/api/auth/refresh").cookie(refreshCookie(response)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.user.email").value(email))
			.andExpect(jsonPath("$.user.displayName").value("Ana Google"));
	}

	@Test
	void sameGoogleAccountReturnsSameUser() throws Exception {
		String sub = UUID.randomUUID().toString();
		String email = randomEmail();

		String firstId = userId(googleLogin(sub, email, true));
		// Aunque el email haya cambiado en Google, se reconoce por "sub"
		String secondId = userId(googleLogin(sub, randomEmail(), true));

		assertThat(secondId).isEqualTo(firstId);
	}

	@Test
	void verifiedEmailLinksExistingAccountAndDisablesPassword() throws Exception {
		String email = randomEmail();
		MvcResult registered = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email": "%s", "password": "contraseña-segura", "displayName": "Ana"}
						""".formatted(email)))
			.andExpect(status().isCreated())
			.andReturn();
		String passwordUserId = JsonPath.read(registered.getResponse().getContentAsString(), "$.user.id");
		Cookie passwordSession = registered.getResponse().getCookie(RefreshTokenCookie.NAME);

		MockHttpServletResponse response = googleLogin(UUID.randomUUID().toString(), email.toUpperCase(), true);

		assertThat(userId(response)).isEqualTo(passwordUserId);
		// La contraseña y las sesiones anteriores al enlace dejan de valer
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s", "password": "contraseña-segura"}
				""".formatted(email)))
			.andExpect(status().isUnauthorized());
		mvc.perform(post("/api/auth/refresh").cookie(passwordSession)).andExpect(status().isUnauthorized());
	}

	@Test
	void unverifiedEmailDoesNotLinkExistingAccount() throws Exception {
		String email = randomEmail();
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s", "password": "contraseña-segura", "displayName": "Ana"}
				""".formatted(email)))
			.andExpect(status().isCreated());

		MockHttpServletResponse response = googleLogin(UUID.randomUUID().toString(), email, false);

		assertThat(response.getRedirectedUrl()).isEqualTo(props.frontendUrl() + "/login?error=cuenta-existente");
		assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).isNull();
	}

	// --- utilidades ---

	/** Simula el final del login con Google: lo que Spring entrega al success handler. */
	private MockHttpServletResponse googleLogin(String sub, String email, boolean emailVerified) throws Exception {
		Instant now = Instant.now();
		OidcIdToken idToken = OidcIdToken.withTokenValue("id-token-de-prueba")
			.subject(sub)
			.claim("email", email)
			.claim("email_verified", emailVerified)
			.claim("name", "Ana Google")
			.issuedAt(now)
			.expiresAt(now.plusSeconds(60))
			.build();
		DefaultOidcUser googleUser = new DefaultOidcUser(List.of(new SimpleGrantedAuthority("OIDC_USER")), idToken);
		var authentication = new OAuth2AuthenticationToken(googleUser, googleUser.getAuthorities(), "google");

		MockHttpServletResponse response = new MockHttpServletResponse();
		successHandler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);
		return response;
	}

	private String userId(MockHttpServletResponse googleResponse) throws Exception {
		MvcResult result = mvc.perform(post("/api/auth/refresh").cookie(refreshCookie(googleResponse)))
			.andExpect(status().isOk())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.user.id");
	}

	private static Cookie refreshCookie(MockHttpServletResponse response) {
		Cookie cookie = response.getCookie(RefreshTokenCookie.NAME);
		assertThat(cookie).isNotNull();
		return cookie;
	}

	private static String randomEmail() {
		return "user-" + UUID.randomUUID() + "@gmail.com";
	}

}
