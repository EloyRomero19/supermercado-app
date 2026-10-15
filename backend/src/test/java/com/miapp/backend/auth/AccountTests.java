package com.miapp.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestcontainersConfiguration;

import jakarta.servlet.http.Cookie;

/** Borrar la cuenta: DELETE /api/me con la contraseña. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AccountTests {

	private static final String PASSWORD = "contraseña-segura";

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	/** Un usuario registrado: lo necesario para usarlo y comprobar después que ya no existe. */
	record Account(String id, String email, String bearer, Cookie refreshCookie) {
	}

	@Test
	void wrongPasswordDeletesNothing() throws Exception {
		Account ana = register("Ana");

		deleteAccount(ana, "otra-contraseña")
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail").value("La contraseña no es correcta"));
		deleteAccount(ana, "").andExpect(status().isBadRequest());

		mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, ana.bearer())).andExpect(status().isOk());
	}

	@Test
	void deletesAccountSessionsAndClearsCookie() throws Exception {
		Account ana = register("Ana");

		MvcResult result = deleteAccount(ana, PASSWORD).andExpect(status().isNoContent()).andReturn();
		assertThat(result.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("refresh_token=", "Max-Age=0");

		mvc.perform(login(ana.email(), PASSWORD)).andExpect(status().isUnauthorized());
		mvc.perform(post("/api/auth/refresh").cookie(ana.refreshCookie())).andExpect(status().isUnauthorized());
		assertThat(count("select count(*) from app_user where id = ?::uuid", ana.id())).isZero();
		assertThat(count("select count(*) from refresh_token where user_id = ?::uuid", ana.id())).isZero();

		// El email queda libre para una cuenta nueva
		mvc.perform(registerRequest(ana.email(), "Ana otra vez")).andExpect(status().isCreated());
	}

	/**
	 * Ana es propietaria de "Solo mía" (sin nadie más) y de "Casa" (con Beto), y miembro de
	 * "Piso" (de Carla). Al borrar su cuenta: "Solo mía" desaparece, "Casa" pasa a Beto y en
	 * "Piso" deja de ser miembro. Lo que añadió en listas ajenas sigue, sin su nombre.
	 */
	@Test
	void listsAreDeletedInheritedOrLeft() throws Exception {
		Account ana = register("Ana");
		Account beto = register("Beto");
		Account carla = register("Carla");
		String soloMia = createList(ana, "Solo mía");
		String casa = createList(ana, "Casa");
		join(beto, casa);
		String piso = createList(carla, "Piso");
		join(ana, piso);
		as(ana, post("/api/lists/" + piso + "/items"), "{\"customName\": \"Leche\", \"quantity\": 1}")
			.andExpect(status().isCreated());

		deleteAccount(ana, PASSWORD).andExpect(status().isNoContent());

		assertThat(count("select count(*) from shopping_list where id = ?::uuid", soloMia)).isZero();
		as(beto, get("/api/lists/" + casa))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.myRole").value("OWNER"))
			.andExpect(jsonPath("$.members.length()").value(1));
		as(carla, get("/api/lists/" + piso))
			.andExpect(jsonPath("$.members.length()").value(1))
			.andExpect(jsonPath("$.members[0].userId").value(carla.id()));
		as(carla, get("/api/lists/" + piso + "/items"))
			.andExpect(jsonPath("$[0].name").value("Leche"))
			.andExpect(jsonPath("$[0].addedByName").value(nullValue()));
	}

	// --- utilidades ---

	private Account register(String name) throws Exception {
		String email = "user-" + UUID.randomUUID() + "@test.com";
		MvcResult result = mvc.perform(registerRequest(email, name)).andExpect(status().isCreated()).andReturn();
		String body = result.getResponse().getContentAsString();
		return new Account(JsonPath.read(body, "$.user.id"), email, "Bearer " + JsonPath.read(body, "$.accessToken"),
				result.getResponse().getCookie(RefreshTokenCookie.NAME));
	}

	private ResultActions deleteAccount(Account account, String password) throws Exception {
		return as(account, delete("/api/me"), "{\"password\": \"%s\"}".formatted(password));
	}

	private String createList(Account owner, String name) throws Exception {
		String body = as(owner, post("/api/lists"), "{\"name\": \"%s\"}".formatted(name))
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.id");
	}

	private void join(Account account, String listId) throws Exception {
		String code = jdbc.queryForObject("select invite_code from shopping_list where id = ?::uuid", String.class, listId);
		as(account, post("/api/lists/join"), "{\"code\": \"%s\"}".formatted(code)).andExpect(status().isOk());
	}

	private ResultActions as(Account account, MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, account.bearer()));
	}

	private ResultActions as(Account account, MockHttpServletRequestBuilder request, String json) throws Exception {
		return as(account, request.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private long count(String sql, String id) {
		return jdbc.queryForObject(sql, Long.class, id);
	}

	private static MockHttpServletRequestBuilder registerRequest(String email, String name) {
		return post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s", "password": "%s", "displayName": "%s"}""".formatted(email, PASSWORD, name));
	}

	private static MockHttpServletRequestBuilder login(String email, String password) {
		return post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s", "password": "%s"}""".formatted(email, password));
	}

}
