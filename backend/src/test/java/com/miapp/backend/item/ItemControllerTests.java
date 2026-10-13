package com.miapp.backend.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestUsers;
import com.miapp.backend.TestUsers.TestUser;
import com.miapp.backend.TestcontainersConfiguration;

import jakarta.persistence.EntityManager;

/** Ana es propietaria de la lista y Beto miembro. Carla tiene su propia lista. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ItemControllerTests {

	@Autowired
	MockMvc mvc;

	TestUser ana;
	TestUser beto;
	TestUser carla;
	String listId;
	String items;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc);
		beto = TestUsers.register(mvc);
		carla = TestUsers.register(mvc);
		String list = body(as(ana, post("/api/lists"), "{\"name\": \"Casa\"}"));
		listId = JsonPath.read(list, "$.id");
		items = "/api/lists/" + listId + "/items";
		as(beto, post("/api/lists/join"), "{\"code\": \"%s\"}".formatted((String) JsonPath.read(list, "$.inviteCode")));
	}

	@Test
	void addCatalogProduct() throws Exception {
		add(ana, "{\"productId\": %d, \"quantity\": 2, \"note\": \" sin sal \"}".formatted(productId("salmon")))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.name").value("Salmón"))
			.andExpect(jsonPath("$.icon").value("🐟"))
			.andExpect(jsonPath("$.categoryName").value("Pescadería"))
			.andExpect(jsonPath("$.quantity").value(2))
			.andExpect(jsonPath("$.note").value("sin sal"))
			.andExpect(jsonPath("$.checked").value(false))
			.andExpect(jsonPath("$.addedByName").value("Test"));
	}

	@Test
	void addingTheSamePendingProductAddsQuantity() throws Exception {
		long leche = productId("leche entera");
		add(ana, "{\"productId\": %d}".formatted(leche));
		add(beto, "{\"productId\": %d, \"quantity\": 3}".formatted(leche)).andExpect(jsonPath("$.quantity").value(4));

		add(ana, "{\"customName\": \"Pilas AA\"}");
		add(ana, "{\"customName\": \"  pilas aa \"}").andExpect(jsonPath("$.quantity").value(2));

		as(ana, get(items)).andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void addingAProductThatIsAlreadyInTheCartCreatesANewOne() throws Exception {
		long pan = productId("pan de barra");
		String itemId = JsonPath.read(body(add(ana, "{\"productId\": %d}".formatted(pan))), "$.id");
		update(ana, itemId, "{\"checked\": true}");

		add(ana, "{\"productId\": %d}".formatted(pan)).andExpect(jsonPath("$.quantity").value(1));
		as(ana, get(items)).andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void customItemsHaveNoCategory() throws Exception {
		add(ana, "{\"customName\": \"Regalo cumple\"}")
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.productId").value(nullValue()))
			.andExpect(jsonPath("$.icon").value(nullValue()))
			.andExpect(jsonPath("$.categoryName").value(nullValue()));
	}

	@Test
	void exactlyOneOfProductOrCustomName() throws Exception {
		add(ana, "{}").andExpect(status().isBadRequest());
		add(ana, "{\"customName\": \"   \"}").andExpect(status().isBadRequest());
		add(ana, "{\"productId\": %d, \"customName\": \"Leche\"}".formatted(productId("leche entera")))
			.andExpect(status().isBadRequest());
		add(ana, "{\"productId\": 999999}").andExpect(status().isBadRequest());
		add(ana, "{\"customName\": \"Pilas\", \"quantity\": 0}")
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.quantity").value("La cantidad mínima es 1"));
	}

	@Test
	void checkAndUncheck() throws Exception {
		String itemId = JsonPath.read(body(add(ana, "{\"customName\": \"Pilas\"}")), "$.id");

		update(beto, itemId, "{\"checked\": true}")
			.andExpect(jsonPath("$.checked").value(true))
			.andExpect(jsonPath("$.checkedAt").isNotEmpty());
		// Marcar otra vez no cambia quién lo cogió
		update(ana, itemId, "{\"checked\": true}").andExpect(jsonPath("$.checkedByName").value("Test"));

		update(ana, itemId, "{\"checked\": false}")
			.andExpect(jsonPath("$.checked").value(false))
			.andExpect(jsonPath("$.checkedByName").value(nullValue()))
			.andExpect(jsonPath("$.checkedAt").value(nullValue()));
	}

	@Test
	void updateQuantityAndNote() throws Exception {
		String itemId = JsonPath.read(body(add(ana, "{\"customName\": \"Pilas\", \"note\": \"AA\"}")), "$.id");

		update(beto, itemId, "{\"quantity\": 4}").andExpect(jsonPath("$.quantity").value(4)).andExpect(jsonPath("$.note").value("AA"));
		update(beto, itemId, "{\"note\": \"\"}").andExpect(jsonPath("$.note").value(nullValue()));
		update(beto, itemId, "{\"quantity\": 1000}").andExpect(status().isBadRequest());
	}

	@Test
	void removeAndClearChecked() throws Exception {
		String a = JsonPath.read(body(add(ana, "{\"customName\": \"A\"}")), "$.id");
		String b = JsonPath.read(body(add(ana, "{\"customName\": \"B\"}")), "$.id");
		add(ana, "{\"customName\": \"C\"}");
		update(ana, a, "{\"checked\": true}");
		update(ana, b, "{\"checked\": true}");

		as(ana, delete(items).param("checked", "false")).andExpect(status().isBadRequest());
		as(beto, delete(items).param("checked", "true")).andExpect(status().isNoContent());
		as(ana, get(items)).andExpect(jsonPath("$[*].name").value(contains("C")));

		String c = JsonPath.read(body(as(ana, get(items))), "$[0].id");
		as(ana, delete(items + "/" + c)).andExpect(status().isNoContent());
		as(ana, delete(items + "/" + c)).andExpect(status().isNotFound());
	}

	@Test
	void itemsAreSortedLikeTheStore() throws Exception {
		add(ana, "{\"customName\": \"Pilas\"}");
		add(ana, "{\"productId\": %d}".formatted(productId("detergente")));
		add(ana, "{\"productId\": %d}".formatted(productId("tomate")));
		add(ana, "{\"productId\": %d}".formatted(productId("manzana")));

		// Frutas y verduras (1), Limpieza (11), sin categoría al final; dentro, alfabético
		as(ana, get(items)).andExpect(jsonPath("$[*].name").value(contains("Manzana", "Tomate", "Detergente", "Pilas")));
	}

	@Test
	void outsidersCannotSeeOrTouchItems() throws Exception {
		String itemId = JsonPath.read(body(add(ana, "{\"customName\": \"Pilas\"}")), "$.id");

		as(carla, get(items)).andExpect(status().isNotFound());
		add(carla, "{\"customName\": \"Intruso\"}").andExpect(status().isNotFound());
		update(carla, itemId, "{\"checked\": true}").andExpect(status().isNotFound());
		as(carla, delete(items + "/" + itemId)).andExpect(status().isNotFound());
	}

	@Test
	void cannotReachAnItemThroughAnotherListUrl() throws Exception {
		String itemId = JsonPath.read(body(add(ana, "{\"customName\": \"Pilas\"}")), "$.id");
		String carlasList = JsonPath.read(body(as(carla, post("/api/lists"), "{\"name\": \"Mía\"}")), "$.id");

		// Carla es miembro de SU lista, pero el item es de la de Ana: ataque IDOR
		as(carla, patch("/api/lists/" + carlasList + "/items/" + itemId), "{\"checked\": true}")
			.andExpect(status().isNotFound());
		as(carla, delete("/api/lists/" + carlasList + "/items/" + itemId)).andExpect(status().isNotFound());
		as(ana, get(items)).andExpect(jsonPath("$[0].checked").value(false));
	}

	@Test
	void deletingTheListDeletesItsItems() throws Exception {
		add(ana, "{\"customName\": \"Pilas\"}");
		as(ana, delete("/api/lists/" + listId)).andExpect(status().isNoContent());
		as(ana, get(items)).andExpect(status().isNotFound());
	}

	// --- Bloqueo optimista ---

	@Autowired
	PlatformTransactionManager transactionManager;

	@Autowired
	EntityManager entityManager;

	@Test
	void concurrentEditsDoNotSilentlyOverwriteEachOther() throws Exception {
		UUID itemId = UUID.fromString(JsonPath.read(body(add(ana, "{\"customName\": \"Pilas\"}")), "$.id"));
		TransactionTemplate tx = new TransactionTemplate(transactionManager);
		TransactionTemplate otherTx = new TransactionTemplate(transactionManager);
		otherTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

		assertThatThrownBy(() -> tx.executeWithoutResult(status -> {
			// Ana abre el producto (versión 0)...
			ListItem anasCopy = entityManager.find(ListItem.class, itemId);
			// ...mientras Beto, en otra transacción, cambia la cantidad y confirma (versión 1)
			otherTx.executeWithoutResult(other -> entityManager.find(ListItem.class, itemId).setQuantity((short) 5));
			// Ana cambia su copia, basada en la versión 0. Al confirmar (commit), Hibernate hace
			// "UPDATE ... WHERE id = ? AND version = 0", no encuentra la fila y no pisa el cambio de Beto
			anasCopy.setQuantity((short) 2);
		})).isInstanceOf(ObjectOptimisticLockingFailureException.class);

		as(ana, get(items)).andExpect(jsonPath("$[0].quantity").value(5));
	}

	// --- utilidades ---

	private ResultActions as(TestUser user, MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, user.bearer()));
	}

	private ResultActions as(TestUser user, MockHttpServletRequestBuilder request, String json) throws Exception {
		return as(user, request.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions add(TestUser user, String json) throws Exception {
		return as(user, post(items), json);
	}

	private ResultActions update(TestUser user, String itemId, String json) throws Exception {
		return as(user, patch(items + "/" + itemId), json);
	}

	private long productId(String query) throws Exception {
		Number id = JsonPath.read(body(as(ana, get("/api/products").param("q", query))), "$[0].id");
		return id.longValue();
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString();
	}

}
