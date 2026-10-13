package com.miapp.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestcontainersConfiguration;

import jakarta.servlet.http.Cookie;

/**
 * Prueba el flujo completo de autenticación contra un Postgres real (Testcontainers).
 * Cada test usa un email aleatorio para no depender de los demás.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthControllerTests {

	private static final String PASSWORD = "contraseña-segura";

	@Autowired
	MockMvc mvc;

	@Test
	void registerReturnsAccessTokenAndRefreshCookie() throws Exception {
		String email = randomEmail();

		MvcResult result = mvc.perform(register(email, PASSWORD, "Ana"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.accessToken").isNotEmpty())
			.andExpect(jsonPath("$.expiresIn").value(900))
			.andExpect(jsonPath("$.user.email").value(email))
			.andExpect(jsonPath("$.user.passwordHash").doesNotExist())
			.andReturn();

		String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
		assertThat(setCookie).contains("refresh_token=", "HttpOnly", "Secure", "SameSite=Strict", "Path=/api/auth");
	}

	@Test
	void meRequiresValidAccessToken() throws Exception {
		mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, "Bearer token-falso"))
			.andExpect(status().isUnauthorized());

		String email = randomEmail();
		String accessToken = accessToken(mvc.perform(register(email, PASSWORD, "Ana")).andReturn());

		mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value(email))
			.andExpect(jsonPath("$.displayName").value("Ana"));
	}

	@Test
	void registerRejectsDuplicateEmailIgnoringCase() throws Exception {
		String email = randomEmail();
		mvc.perform(register(email, PASSWORD, "Ana")).andExpect(status().isCreated());

		mvc.perform(register(email.toUpperCase(), PASSWORD, "Otra Ana"))
			.andExpect(status().isConflict())
			.andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE))
			.andExpect(jsonPath("$.detail").value("Ya existe una cuenta con ese email"));
	}

	@Test
	void registerValidatesFields() throws Exception {
		mvc.perform(register("no-es-un-email", "corta", ""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.email").value("El email no es válido"))
			.andExpect(jsonPath("$.errors.password").value("La contraseña debe tener entre 8 y 72 caracteres"))
			.andExpect(jsonPath("$.errors.displayName").exists());
	}

	@Test
	void loginChecksPassword() throws Exception {
		String email = randomEmail();
		mvc.perform(register(email, PASSWORD, "Ana")).andExpect(status().isCreated());

		mvc.perform(login(email, "otra-contraseña"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.detail").value("Email o contraseña incorrectos"));
		mvc.perform(login(randomEmail(), PASSWORD))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.detail").value("Email o contraseña incorrectos"));

		mvc.perform(login("  " + email.toUpperCase() + " ", PASSWORD))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").isNotEmpty());
	}

	@Test
	void refreshRotatesTokenAndDetectsReuse() throws Exception {
		Cookie first = refreshCookie(mvc.perform(register(randomEmail(), PASSWORD, "Ana")).andReturn());

		MvcResult refreshed = mvc.perform(post("/api/auth/refresh").cookie(first))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").isNotEmpty())
			.andReturn();
		Cookie second = refreshCookie(refreshed);
		assertThat(second.getValue()).isNotEqualTo(first.getValue());

		// Reutilizar el token ya rotado = posible robo: se revoca toda la familia...
		mvc.perform(post("/api/auth/refresh").cookie(first)).andExpect(status().isUnauthorized());
		// ...incluido el token nuevo, aunque no se hubiera usado
		mvc.perform(post("/api/auth/refresh").cookie(second)).andExpect(status().isUnauthorized());
	}

	@Test
	void refreshRejectsOtherOrigins() throws Exception {
		Cookie cookie = refreshCookie(mvc.perform(register(randomEmail(), PASSWORD, "Ana")).andReturn());

		mvc.perform(post("/api/auth/refresh").cookie(cookie).header(HttpHeaders.ORIGIN, "https://web-maliciosa.com"))
			.andExpect(status().isForbidden());
		mvc.perform(post("/api/auth/refresh").cookie(cookie).header(HttpHeaders.ORIGIN, "http://localhost:5173"))
			.andExpect(status().isOk());
	}

	@Test
	void refreshWithoutCookieIsUnauthorized() throws Exception {
		mvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized());
	}

	@Test
	void logoutRevokesSessionAndClearsCookie() throws Exception {
		Cookie cookie = refreshCookie(mvc.perform(register(randomEmail(), PASSWORD, "Ana")).andReturn());

		MvcResult logout = mvc.perform(post("/api/auth/logout").cookie(cookie))
			.andExpect(status().isNoContent())
			.andReturn();
		assertThat(logout.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("refresh_token=", "Max-Age=0");

		mvc.perform(post("/api/auth/refresh").cookie(cookie)).andExpect(status().isUnauthorized());
	}

	// --- utilidades ---

	private static RequestBuilder register(String email, String password,
			String displayName) {
		return post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s", "password": "%s", "displayName": "%s"}
				""".formatted(email, password, displayName));
	}

	private static RequestBuilder login(String email, String password) {
		return post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s", "password": "%s"}
				""".formatted(email, password));
	}

	private static String accessToken(MvcResult result) throws Exception {
		return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
	}

	private static Cookie refreshCookie(MvcResult result) {
		Cookie cookie = result.getResponse().getCookie(RefreshTokenCookie.NAME);
		assertThat(cookie).isNotNull();
		return cookie;
	}

	private static String randomEmail() {
		return "user-" + UUID.randomUUID() + "@test.com";
	}

}
