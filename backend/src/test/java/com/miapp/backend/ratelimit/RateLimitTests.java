package com.miapp.backend.ratelimit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.miapp.backend.TestUsers;
import com.miapp.backend.TestUsers.TestUser;
import com.miapp.backend.TestcontainersConfiguration;

/** Con el límite activado (en el resto de tests está desactivado). */
@SpringBootTest(properties = "app.rate-limit.enabled=true")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class RateLimitTests {

	@Autowired
	MockMvc mvc;

	@Test
	void tooManyLoginAttemptsFromTheSameIpGet429() throws Exception {
		for (int i = 0; i < 10; i++) {
			login("10.0.0.1").andExpect(status().isUnauthorized());
		}
		login("10.0.0.1")
			.andExpect(status().isTooManyRequests())
			.andExpect(header().exists(HttpHeaders.RETRY_AFTER))
			.andExpect(jsonPath("$.detail").exists());
		// Otra IP no está afectada
		login("10.0.0.2").andExpect(status().isUnauthorized());
	}

	@Test
	void guessingInviteCodesIsLimitedPerUser() throws Exception {
		TestUser user = TestUsers.register(mvc);
		for (int i = 0; i < 10; i++) {
			join(user, "INTENTO" + i).andExpect(status().isNotFound());
		}
		join(user, "INTENTO10").andExpect(status().isTooManyRequests());
		// Otro usuario sí puede
		join(TestUsers.register(mvc), "INTENTO11").andExpect(status().isNotFound());
	}

	@Test
	void healthIsPublicAndRevealsNothingElse() throws Exception {
		mvc.perform(get("/actuator/health"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("UP"))
			.andExpect(jsonPath("$.components").doesNotExist());
		mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
	}

	private ResultActions login(String ip) throws Exception {
		return mvc.perform(post("/api/auth/login")
			.with(request -> {
				request.setRemoteAddr(ip);
				return request;
			})
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"nadie@test.com\", \"password\": \"incorrecta\"}"));
	}

	private ResultActions join(TestUser user, String code) throws Exception {
		return mvc.perform(post("/api/lists/join")
			.header(HttpHeaders.AUTHORIZATION, user.bearer())
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"code\": \"%s\"}".formatted(code)));
	}

}
