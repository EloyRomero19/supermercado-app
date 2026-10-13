package com.miapp.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/** Utilidades para tests que necesitan usuarios autenticados. */
public final class TestUsers {

	/** Usuario registrado: su id y la cabecera "Bearer <token>" lista para usar. */
	public record TestUser(String id, String bearer) {
	}

	private TestUsers() {
	}

	public static TestUser register(MockMvc mvc) throws Exception {
		String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "user-%s@test.com", "password": "contraseña-segura", "displayName": "Test"}
				""".formatted(UUID.randomUUID())))
			.andReturn()
			.getResponse()
			.getContentAsString();
		return new TestUser(JsonPath.read(body, "$.user.id"), "Bearer " + JsonPath.read(body, "$.accessToken"));
	}

}
