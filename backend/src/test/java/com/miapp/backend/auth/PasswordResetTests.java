package com.miapp.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;

import com.miapp.backend.TestcontainersConfiguration;

import jakarta.servlet.http.Cookie;

/**
 * "¿Has olvidado tu contraseña?". El enlace se saca del evento que pide enviar el email
 * (@RecordApplicationEvents guarda los eventos publicados durante cada test).
 */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
@Import(TestcontainersConfiguration.class)
class PasswordResetTests {

	private static final String PASSWORD = "contraseña-segura";
	private static final String NEW_PASSWORD = "otra-contraseña-nueva";

	@Autowired
	MockMvc mvc;

	@Autowired
	ApplicationEvents events;

	@Autowired
	JdbcTemplate jdbc;

	@Test
	void unknownEmailGetsTheSameAnswerButNoEmail() throws Exception {
		mvc.perform(forgot(randomEmail())).andExpect(status().isNoContent());

		assertThat(events.stream(PasswordResetRequested.class)).isEmpty();
	}

	@Test
	void linkChangesPasswordAndClosesOtherSessions() throws Exception {
		String email = randomEmail();
		Cookie oldSession = mvc.perform(register(email)).andReturn().getResponse().getCookie(RefreshTokenCookie.NAME);

		mvc.perform(forgot(email.toUpperCase())).andExpect(status().isNoContent());
		PasswordResetRequested sent = events.stream(PasswordResetRequested.class).findFirst().orElseThrow();
		assertThat(sent.email()).isEqualTo(email);
		assertThat(sent.link()).startsWith("http://localhost:5173/restablecer#");

		// Deja la sesión iniciada, como el login
		MvcResult reset = mvc.perform(reset(token(sent), NEW_PASSWORD))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accessToken").isNotEmpty())
			.andExpect(jsonPath("$.user.email").value(email))
			.andReturn();
		assertThat(reset.getResponse().getCookie(RefreshTokenCookie.NAME)).isNotNull();

		mvc.perform(login(email, PASSWORD)).andExpect(status().isUnauthorized());
		mvc.perform(login(email, NEW_PASSWORD)).andExpect(status().isOk());
		// La sesión que había abierta antes ya no sirve
		mvc.perform(post("/api/auth/refresh").cookie(oldSession)).andExpect(status().isUnauthorized());
	}

	@Test
	void linkWorksOnlyOnce() throws Exception {
		String email = randomEmail();
		mvc.perform(register(email));
		mvc.perform(forgot(email));
		String token = token(events.stream(PasswordResetRequested.class).findFirst().orElseThrow());

		mvc.perform(reset(token, NEW_PASSWORD)).andExpect(status().isOk());
		mvc.perform(reset(token, "y-otra-mas-distinta"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("El enlace no es válido o ha caducado. Pide uno nuevo"));
	}

	@Test
	void usingOneLinkCancelsTheOthers() throws Exception {
		String email = randomEmail();
		mvc.perform(register(email));
		mvc.perform(forgot(email));
		mvc.perform(forgot(email));
		List<String> tokens = events.stream(PasswordResetRequested.class).map(PasswordResetTests::token).toList();
		assertThat(tokens).hasSize(2);

		mvc.perform(reset(tokens.get(1), NEW_PASSWORD)).andExpect(status().isOk());
		mvc.perform(reset(tokens.get(0), "y-otra-mas-distinta")).andExpect(status().isBadRequest());
	}

	@Test
	void expiredLinkIsRejected() throws Exception {
		String email = randomEmail();
		mvc.perform(register(email));
		mvc.perform(forgot(email));
		String token = token(events.stream(PasswordResetRequested.class).findFirst().orElseThrow());
		jdbc.update("""
				update password_reset_token set expires_at = now() - interval '1 minute'
				where user_id = (select id from app_user where email = ?)""", email);

		mvc.perform(reset(token, NEW_PASSWORD)).andExpect(status().isBadRequest());
		mvc.perform(reset("no-es-un-token", NEW_PASSWORD)).andExpect(status().isBadRequest());
	}

	@Test
	void resetValidatesPassword() throws Exception {
		mvc.perform(reset("loquesea", "corta"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.password").value("La contraseña debe tener entre 8 y 72 caracteres"));
	}

	@Test
	void atMostThreeLinksPerHour() throws Exception {
		String email = randomEmail();
		mvc.perform(register(email));
		for (int i = 0; i < 5; i++) {
			mvc.perform(forgot(email)).andExpect(status().isNoContent());
		}

		assertThat(events.stream(PasswordResetRequested.class)).hasSize(PasswordResetService.MAX_LINKS_PER_HOUR);
	}

	/** Quien entraba con Google no tiene contraseña: con el enlace puede crearse una. */
	@Test
	void accountWithoutPasswordCanCreateOne() throws Exception {
		String email = randomEmail();
		jdbc.update("insert into app_user (email, display_name) values (?, 'Ana')", email);
		mvc.perform(login(email, NEW_PASSWORD)).andExpect(status().isUnauthorized());

		mvc.perform(forgot(email));
		mvc.perform(reset(token(events.stream(PasswordResetRequested.class).findFirst().orElseThrow()), NEW_PASSWORD))
			.andExpect(status().isOk());

		mvc.perform(login(email, NEW_PASSWORD)).andExpect(status().isOk());
	}

	// --- utilidades ---

	private static String token(PasswordResetRequested event) {
		return event.link().substring(event.link().indexOf('#') + 1);
	}

	private static RequestBuilder register(String email) {
		return json("/api/auth/register", """
				{"email": "%s", "password": "%s", "displayName": "Ana"}""".formatted(email, PASSWORD));
	}

	private static RequestBuilder login(String email, String password) {
		return json("/api/auth/login", """
				{"email": "%s", "password": "%s"}""".formatted(email, password));
	}

	private static RequestBuilder forgot(String email) {
		return json("/api/auth/forgot-password", """
				{"email": "%s"}""".formatted(email));
	}

	private static RequestBuilder reset(String token, String password) {
		return json("/api/auth/reset-password", """
				{"token": "%s", "password": "%s"}""".formatted(token, password));
	}

	private static RequestBuilder json(String url, String body) {
		return post(url).contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String randomEmail() {
		return "user-" + UUID.randomUUID() + "@test.com";
	}

}
