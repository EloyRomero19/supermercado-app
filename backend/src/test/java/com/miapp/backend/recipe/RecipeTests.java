package com.miapp.backend.recipe;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.stream.Collectors;

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
class RecipeTests {

	@Autowired
	MockMvc mvc;

	TestUser ana;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc);
	}

	@Test
	void recipeBookLists15RecipesInOrder() throws Exception {
		as(get("/api/recipes"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(15))
			.andExpect(jsonPath("$[0].name").value("Tortilla de patatas"))
			.andExpect(jsonPath("$[0].emoji").value("🥔"))
			.andExpect(jsonPath("$[0].ingredientCount").value(5));
	}

	@Test
	void recipeDetailHasCatalogIngredientsAndSteps() throws Exception {
		as(get("/api/recipes/" + recipeId("Tortilla de patatas")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.ingredients[*].name").value(contains("Patata", "Huevos", "Cebolla", "Aceite de oliva virgen extra", "Sal")))
			.andExpect(jsonPath("$.ingredients[0].amount").value("1 kg"))
			.andExpect(jsonPath("$.ingredients[0].icon").value("🥔"))
			.andExpect(jsonPath("$.ingredients[0].categoryName").value("Frutas y verduras"))
			.andExpect(jsonPath("$.steps.length()").value(4));
	}

	@Test
	void unknownRecipeIs404AndRecipesNeedLogin() throws Exception {
		as(get("/api/recipes/999")).andExpect(status().isNotFound());
		mvc.perform(get("/api/recipes")).andExpect(status().isUnauthorized());
	}

	@Test
	void addAllIngredientsOfARecipeAtOnce() throws Exception {
		String items = "/api/lists/" + newList() + "/items";
		String detail = body(as(get("/api/recipes/" + recipeId("Gazpacho andaluz"))));
		List<Number> productIds = JsonPath.read(detail, "$.ingredients[*].productId");
		String payload = productIds.stream()
			.map(id -> "{\"productId\": %d, \"note\": \"Gazpacho andaluz\"}".formatted(id.longValue()))
			.collect(Collectors.joining(",", "{\"items\": [", "]}"));

		as(post(items + "/bulk"), payload)
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.length()").value(productIds.size()))
			.andExpect(jsonPath("$[0].note").value("Gazpacho andaluz"));
		as(get(items)).andExpect(jsonPath("$.length()").value(productIds.size()));
	}

	@Test
	void bulkAddIsAllOrNothing() throws Exception {
		String items = "/api/lists/" + newList() + "/items";
		String detail = body(as(get("/api/recipes/" + recipeId("Hummus de garbanzos"))));
		Number valid = JsonPath.read(detail, "$.ingredients[0].productId");

		// El segundo producto no existe: falla todo, el primero tampoco debe quedar añadido
		as(post(items + "/bulk"), "{\"items\": [{\"productId\": %d}, {\"productId\": 999999}]}".formatted(valid.longValue()))
			.andExpect(status().isBadRequest());
		as(get(items)).andExpect(jsonPath("$.length()").value(0));
		as(get(items.replace("/items", "/recent"))).andExpect(jsonPath("$.length()").value(0));

		as(post(items + "/bulk"), "{\"items\": []}").andExpect(status().isBadRequest());
	}

	// --- utilidades ---

	private String newList() throws Exception {
		return JsonPath.read(body(as(post("/api/lists"), "{\"name\": \"Casa\"}")), "$.id");
	}

	private int recipeId(String name) throws Exception {
		List<Integer> ids = JsonPath.read(body(as(get("/api/recipes"))), "$[?(@.name == '%s')].id".formatted(name));
		return ids.get(0);
	}

	private ResultActions as(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, ana.bearer()));
	}

	private ResultActions as(MockHttpServletRequestBuilder request, String json) throws Exception {
		return as(request.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString();
	}

}
