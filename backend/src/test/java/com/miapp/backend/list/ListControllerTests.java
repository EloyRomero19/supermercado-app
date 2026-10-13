package com.miapp.backend.list;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

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

/** Ana crea la lista; Beto se une con el código; Carla es ajena a la lista. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ListControllerTests {

	@Autowired
	MockMvc mvc;

	TestUser ana;
	TestUser beto;
	TestUser carla;

	@BeforeEach
	void users() throws Exception {
		ana = TestUsers.register(mvc);
		beto = TestUsers.register(mvc);
		carla = TestUsers.register(mvc);
	}

	@Test
	void createListMakesYouOwnerWithAnInviteCode() throws Exception {
		as(ana, post("/api/lists"), "{\"name\": \"  Casa  \"}")
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.name").value("Casa"))
			.andExpect(jsonPath("$.myRole").value("OWNER"))
			.andExpect(jsonPath("$.inviteCode").value(matchesPattern("[2-9A-HJKMNP-TW-Z]{8}")))
			.andExpect(jsonPath("$.members.length()").value(1))
			.andExpect(jsonPath("$.members[0].userId").value(ana.id()));
	}

	@Test
	void joinWithCodeIsIdempotentAndAcceptsFormatting() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String code = (String) list.get("inviteCode");
		String messyCode = " " + code.substring(0, 4).toLowerCase() + "-" + code.substring(4).toLowerCase() + " ";

		join(beto, messyCode).andExpect(status().isOk()).andExpect(jsonPath("$.myRole").value("MEMBER"));
		join(beto, code).andExpect(status().isOk()).andExpect(jsonPath("$.members.length()").value(2));

		as(beto, get("/api/lists"))
			.andExpect(jsonPath("$[0].id").value(list.get("id")))
			.andExpect(jsonPath("$[0].memberCount").value(2))
			.andExpect(jsonPath("$[0].myRole").value("MEMBER"));
	}

	@Test
	void invalidCodeIsNotFound() throws Exception {
		join(beto, "NOEXISTE").andExpect(status().isNotFound());
	}

	@Test
	void outsidersGet404OnEverything() throws Exception {
		String id = (String) createList(ana, "Casa").get("id");

		as(carla, get("/api/lists/" + id)).andExpect(status().isNotFound());
		as(carla, patch("/api/lists/" + id), "{\"name\": \"Mía\"}").andExpect(status().isNotFound());
		as(carla, delete("/api/lists/" + id)).andExpect(status().isNotFound());
		as(carla, post("/api/lists/" + id + "/invite-code")).andExpect(status().isNotFound());
		as(carla, delete("/api/lists/" + id + "/members/" + ana.id())).andExpect(status().isNotFound());
		// Y "mis listas" de Carla no la incluye
		as(carla, get("/api/lists")).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void membersCannotManageTheList() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String id = (String) list.get("id");
		join(beto, (String) list.get("inviteCode"));

		as(beto, patch("/api/lists/" + id), "{\"name\": \"Mía\"}").andExpect(status().isForbidden());
		as(beto, delete("/api/lists/" + id)).andExpect(status().isForbidden());
		as(beto, post("/api/lists/" + id + "/invite-code")).andExpect(status().isForbidden());
		as(beto, delete("/api/lists/" + id + "/members/" + ana.id())).andExpect(status().isForbidden());
	}

	@Test
	void ownerCanRenameAndRegenerateCode() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String id = (String) list.get("id");
		String oldCode = (String) list.get("inviteCode");

		as(ana, patch("/api/lists/" + id), "{\"name\": \"Piso\"}").andExpect(jsonPath("$.name").value("Piso"));

		String body = as(ana, post("/api/lists/" + id + "/invite-code")).andExpect(status().isOk())
			.andReturn().getResponse().getContentAsString();
		String newCode = JsonPath.read(body, "$.inviteCode");
		assertThat(newCode).isNotEqualTo(oldCode);

		join(beto, oldCode).andExpect(status().isNotFound());
		join(beto, newCode).andExpect(status().isOk());
	}

	@Test
	void ownerCanExpelAndMembersCanLeave() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String id = (String) list.get("id");
		join(beto, (String) list.get("inviteCode"));
		join(carla, (String) list.get("inviteCode"));

		as(ana, delete("/api/lists/" + id + "/members/" + beto.id())).andExpect(status().isNoContent());
		as(beto, get("/api/lists/" + id)).andExpect(status().isNotFound());

		as(carla, delete("/api/lists/" + id + "/members/" + carla.id())).andExpect(status().isNoContent());
		as(ana, get("/api/lists/" + id)).andExpect(jsonPath("$.members.length()").value(1));
	}

	@Test
	void whenOwnerLeavesTheOldestMemberInherits() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String id = (String) list.get("id");
		join(beto, (String) list.get("inviteCode"));
		join(carla, (String) list.get("inviteCode"));

		as(ana, delete("/api/lists/" + id + "/members/" + ana.id())).andExpect(status().isNoContent());

		as(beto, get("/api/lists/" + id)).andExpect(jsonPath("$.myRole").value("OWNER"));
		as(carla, get("/api/lists/" + id)).andExpect(jsonPath("$.myRole").value("MEMBER"));
		as(ana, get("/api/lists/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void whenTheLastMemberLeavesTheListIsDeleted() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String id = (String) list.get("id");

		as(ana, delete("/api/lists/" + id + "/members/" + ana.id())).andExpect(status().isNoContent());

		as(ana, get("/api/lists")).andExpect(jsonPath("$.length()").value(0));
		join(beto, (String) list.get("inviteCode")).andExpect(status().isNotFound());
	}

	@Test
	void deletingTheListRemovesAccessForEveryone() throws Exception {
		Map<String, Object> list = createList(ana, "Casa");
		String id = (String) list.get("id");
		join(beto, (String) list.get("inviteCode"));

		as(ana, delete("/api/lists/" + id)).andExpect(status().isNoContent());

		as(beto, get("/api/lists/" + id)).andExpect(status().isNotFound());
		as(beto, get("/api/lists")).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void myListsShowsOnlyMineNewestFirst() throws Exception {
		createList(ana, "Primera");
		createList(ana, "Segunda");
		createList(beto, "De Beto");

		as(ana, get("/api/lists"))
			.andExpect(jsonPath("$[*].name").value(contains("Segunda", "Primera")))
			.andExpect(jsonPath("$[0].myRole").value("OWNER"))
			.andExpect(jsonPath("$[0].memberCount").value(1))
			.andExpect(jsonPath("$[0].itemCount").value(0));
	}

	@Test
	void myListsShowShoppingProgress() throws Exception {
		String id = (String) createList(ana, "Casa").get("id");
		String items = "/api/lists/" + id + "/items";
		String first = JsonPath.read(body(as(ana, post(items), "{\"customName\": \"A\"}")), "$.id");
		as(ana, post(items), "{\"customName\": \"B\"}");
		as(ana, patch(items + "/" + first), "{\"checked\": true}");

		as(ana, get("/api/lists"))
			.andExpect(jsonPath("$[0].itemCount").value(2))
			.andExpect(jsonPath("$[0].checkedCount").value(1));
	}

	@Test
	void validatesNameAndIds() throws Exception {
		as(ana, post("/api/lists"), "{\"name\": \"  \"}")
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.errors.name").value("El nombre es obligatorio"));
		as(ana, get("/api/lists/no-es-un-uuid")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/lists")).andExpect(status().isUnauthorized());
	}

	// --- utilidades ---

	private ResultActions as(TestUser user, MockHttpServletRequestBuilder request)
			throws Exception {
		return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, user.bearer()));
	}

	private ResultActions as(TestUser user, MockHttpServletRequestBuilder request,
			String json) throws Exception {
		return as(user, request.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions join(TestUser user, String code) throws Exception {
		return as(user, post("/api/lists/join"), "{\"code\": \"%s\"}".formatted(code));
	}

	private Map<String, Object> createList(TestUser owner, String name) throws Exception {
		String body = as(owner, post("/api/lists"), "{\"name\": \"%s\"}".formatted(name))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$");
	}


	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString();
	}

}
