package com.miapp.backend.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestUsers;
import com.miapp.backend.TestcontainersConfiguration;

/** Busca sobre el catálogo real de la migración V2. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ProductControllerTests {

	@Autowired
	MockMvc mvc;

	String bearer;

	@BeforeEach
	void login() throws Exception {
		bearer = TestUsers.registerAndGetBearer(mvc);
	}

	@Test
	void ignoresAccentsAndCase() throws Exception {
		assertThat(search("PLATANO")).first().isEqualTo("Plátano");
	}

	@Test
	void findsWordsInsideTheName() throws Exception {
		assertThat(search("pollo")).contains("Pechuga de pollo", "Pollo entero", "Caldo de pollo")
			.allSatisfy(name -> assertThat(ProductService.normalize(name)).contains("pollo"));
	}

	@Test
	void namesStartingWithTheQueryComeFirst() throws Exception {
		assertThat(search("pan")).startsWith("Pan de barra", "Pan de molde");
	}

	@Test
	void toleratesTypos() throws Exception {
		assertThat(search("tomte")).first().isEqualTo("Tomate");
		assertThat(search("qeso")).first().asString().startsWith("Queso");
	}

	@Test
	void similarProductsOnlyWhenThereAreNoDirectMatches() throws Exception {
		// Sin este criterio también saldrían "Espinacas" o "Carne picada"
		assertThat(search("piña")).containsExactly("Piña", "Zumo de piña");
	}

	@Test
	void respectsLimit() throws Exception {
		mvc.perform(get("/api/products").param("q", "leche").param("limit", "2").header(HttpHeaders.AUTHORIZATION, bearer))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void includesCategory() throws Exception {
		mvc.perform(get("/api/products").param("q", "salmon").header(HttpHeaders.AUTHORIZATION, bearer))
			.andExpect(jsonPath("$[0].name").value("Salmón"))
			.andExpect(jsonPath("$[0].categoryName").value("Pescadería"))
			.andExpect(jsonPath("$[0].categoryId").isNumber());
	}

	@Test
	void symbolsOrBlankQueryReturnNothing() throws Exception {
		assertThat(search("%_%")).isEmpty();
		assertThat(search("   ")).isEmpty();
	}

	@Test
	void validatesParameters() throws Exception {
		mvc.perform(get("/api/products").header(HttpHeaders.AUTHORIZATION, bearer)).andExpect(status().isBadRequest());
		mvc.perform(get("/api/products").param("q", "a".repeat(51)).header(HttpHeaders.AUTHORIZATION, bearer))
			.andExpect(status().isBadRequest());
		mvc.perform(get("/api/products").param("q", "leche").param("limit", "100").header(HttpHeaders.AUTHORIZATION, bearer))
			.andExpect(status().isBadRequest());
	}

	@Test
	void requiresAuthentication() throws Exception {
		mvc.perform(get("/api/products").param("q", "leche")).andExpect(status().isUnauthorized());
	}

	@Test
	void categoriesAreSortedLikeTheStore() throws Exception {
		mvc.perform(get("/api/categories").header(HttpHeaders.AUTHORIZATION, bearer))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(13))
			.andExpect(jsonPath("$[0].name").value("Frutas y verduras"))
			.andExpect(jsonPath("$[12].name").value("Bebé y mascotas"));
	}

	private List<String> search(String query) throws Exception {
		String body = mvc.perform(get("/api/products").param("q", query).header(HttpHeaders.AUTHORIZATION, bearer))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		return JsonPath.read(body, "$[*].name");
	}

}
