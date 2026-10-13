package com.miapp.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/** Utilidades para tests que necesitan un usuario autenticado. */
public final class TestUsers {

	private TestUsers() {
	}

	/** Registra un usuario nuevo y devuelve la cabecera "Bearer <token>" lista para usar. */
	public static String registerAndGetBearer(MockMvc mvc) throws Exception {
		String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "user-%s@test.com", "password": "contraseña-segura", "displayName": "Test"}
				""".formatted(UUID.randomUUID())))
			.andReturn()
			.getResponse()
			.getContentAsString();
		return "Bearer " + JsonPath.read(body, "$.accessToken");
	}

}
