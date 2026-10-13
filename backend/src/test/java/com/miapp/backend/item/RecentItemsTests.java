package com.miapp.backend.item;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestUsers;
import com.miapp.backend.TestUsers.TestUser;
import com.miapp.backend.TestcontainersConfiguration;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class RecentItemsTests {

	@Autowired
	MockMvc mvc;

	TestUser ana;
	String items;
	String recent;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc);
		String listId = JsonPath.read(body(as(post("/api/lists"), "{\"name\": \"Casa\"}")), "$.id");
		items = "/api/lists/" + listId + "/items";
		recent = "/api/lists/" + listId + "/recent";
	}

	@Test
	void newestFirstAndWithoutDuplicates() throws Exception {
		long leche = productId("leche entera");
		add("{\"productId\": %d}".formatted(leche));
		add("{\"customName\": \"Pilas\"}");
		add("{\"productId\": %d}".formatted(productId("tomate")));
		add("{\"productId\": %d}".formatted(leche)); // otra vez: sube al principio

		as(get(recent)).andExpect(status().isOk())
			.andExpect(jsonPath("$[*].name").value(contains("Leche entera", "Tomate", "Pilas")));
	}

	@Test
	void customNamesIgnoreCaseAndKeepTheLastSpelling() throws Exception {
		add("{\"customName\": \"Pilas AA\"}");
		add("{\"customName\": \"pilas aa\"}");

		as(get(recent)).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].name").value("pilas aa"));
	}

	@Test
	void staysAfterRemovingFromTheList() throws Exception {
		String bought = JsonPath.read(body(add("{\"customName\": \"Velas\"}")), "$.id");
		String removed = JsonPath.read(body(add("{\"productId\": %d}".formatted(productId("salmon")))), "$.id");
		as(patch(items + "/" + bought), "{\"checked\": true}");
		as(delete(items).param("checked", "true"));
		as(delete(items + "/" + removed));

		as(get(items)).andExpect(jsonPath("$.length()").value(0));
		as(get(recent)).andExpect(jsonPath("$[*].name").value(contains("Salmón", "Velas")));
	}

	@Test
	void includesIconsAndSections() throws Exception {
		add("{\"customName\": \"Velas de cumpleaños\"}");
		add("{\"productId\": %d}".formatted(productId("salmon")));

		as(get(recent))
			.andExpect(jsonPath("$[0].productId").isNumber())
			.andExpect(jsonPath("$[0].icon").value("🐟"))
			.andExpect(jsonPath("$[0].categoryName").value("Pescadería"))
			.andExpect(jsonPath("$[1].customName").value("Velas de cumpleaños"))
			.andExpect(jsonPath("$[1].icon").value("🕯️"));
	}

	@Test
	void invalidProductsAreNotRecorded() throws Exception {
		add("{\"productId\": 999999}").andExpect(status().isBadRequest());
		as(get(recent)).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void onlyMembersCanSeeIt() throws Exception {
		TestUser carla = TestUsers.register(mvc);
		mvc.perform(get(recent).header(HttpHeaders.AUTHORIZATION, carla.bearer())).andExpect(status().isNotFound());
	}

	// --- utilidades ---

	private ResultActions as(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, ana.bearer()));
	}

	private ResultActions as(MockHttpServletRequestBuilder request, String json) throws Exception {
		return as(request.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions add(String json) throws Exception {
		return as(post(items), json);
	}

	private long productId(String query) throws Exception {
		Number id = JsonPath.read(body(as(get("/api/products").param("q", query))), "$[0].id");
		return id.longValue();
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString();
	}

}
