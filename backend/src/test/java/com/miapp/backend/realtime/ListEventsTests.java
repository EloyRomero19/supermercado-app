package com.miapp.backend.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.miapp.backend.TestUsers;
import com.miapp.backend.TestUsers.TestUser;
import com.miapp.backend.TestcontainersConfiguration;

/**
 * Beto abre el stream SSE de la lista de Ana y comprobamos lo que le llega.
 * Con MockMvc, lo que el SseEmitter envía queda escrito en la respuesta simulada.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ListEventsTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	ListSubscriptions subscriptions;

	TestUser ana;
	TestUser beto;
	String listId;
	String inviteCode;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc);
		beto = TestUsers.register(mvc);
		String list = body(as(ana, post("/api/lists"), "{\"name\": \"Casa\"}"));
		listId = JsonPath.read(list, "$.id");
		inviteCode = JsonPath.read(list, "$.inviteCode");
		as(beto, post("/api/lists/join"), "{\"code\": \"%s\"}".formatted(inviteCode));
	}

	@Test
	void onlyMembersCanSubscribe() throws Exception {
		TestUser carla = TestUsers.register(mvc);
		as(carla, get(events())).andExpect(status().isNotFound());
		mvc.perform(get(events())).andExpect(status().isUnauthorized());
	}

	@Test
	void membersReceiveItemChanges() throws Exception {
		MvcResult betoStream = subscribe(beto);
		assertThat(stream(betoStream)).contains("event:ready");

		String item = body(as(ana, post(items()), "{\"customName\": \"Pilas\"}"));
		String itemId = JsonPath.read(item, "$.id");
		assertThat(stream(betoStream)).contains("event:item-saved", "\"name\":\"Pilas\"", "\"checked\":false");

		as(ana, patch(items() + "/" + itemId), "{\"checked\": true}");
		assertThat(stream(betoStream)).contains("\"checked\":true");

		as(ana, delete(items() + "/" + itemId));
		assertThat(stream(betoStream)).contains("event:items-deleted", itemId);
	}

	@Test
	void clearingTheCartSendsTheDeletedIds() throws Exception {
		String checked = JsonPath.read(body(as(ana, post(items()), "{\"customName\": \"A\"}")), "$.id");
		String pending = JsonPath.read(body(as(ana, post(items()), "{\"customName\": \"B\"}")), "$.id");
		as(ana, patch(items() + "/" + checked), "{\"checked\": true}");
		MvcResult betoStream = subscribe(beto);

		as(ana, delete(items()).param("checked", "true"));

		assertThat(stream(betoStream)).contains("event:items-deleted", checked).doesNotContain(pending);
	}

	@Test
	void failedChangesAreNotBroadcast() throws Exception {
		MvcResult betoStream = subscribe(beto);

		// Validación fallida: la transacción no llega a confirmarse, no debe salir ningún evento
		as(ana, post(items()), "{\"customName\": \"Pilas\", \"quantity\": 0}").andExpect(status().isBadRequest());
		as(ana, post(items()), "{}").andExpect(status().isBadRequest());

		assertThat(stream(betoStream)).doesNotContain("item-saved");
	}

	@Test
	void listChangesAreBroadcast() throws Exception {
		MvcResult betoStream = subscribe(beto);

		as(ana, patch("/api/lists/" + listId), "{\"name\": \"Piso\"}");
		as(ana, post("/api/lists/" + listId + "/invite-code"));

		assertThat(stream(betoStream)).contains("event:list-renamed", "\"name\":\"Piso\"", "event:invite-code-changed");
	}

	@Test
	void newMembersAreAnnounced() throws Exception {
		MvcResult anasStream = subscribe(ana);
		TestUser carla = TestUsers.register(mvc);

		as(carla, post("/api/lists/join"), "{\"code\": \"%s\"}".formatted(inviteCode));
		assertThat(stream(anasStream)).contains("event:members-changed", carla.id());

		// Unirse otra vez no cambia nada: no hay segundo aviso
		int length = stream(anasStream).length();
		as(carla, post("/api/lists/join"), "{\"code\": \"%s\"}".formatted(inviteCode));
		assertThat(stream(anasStream)).hasSize(length);
	}

	@Test
	void expelledMemberIsToldAndDisconnected() throws Exception {
		MvcResult betoStream = subscribe(beto);
		MvcResult anasStream = subscribe(ana);
		assertThat(subscriptions.subscriberCount(UUID.fromString(listId))).isEqualTo(2);

		as(ana, delete("/api/lists/" + listId + "/members/" + beto.id())).andExpect(status().isNoContent());

		assertThat(stream(betoStream)).contains("event:members-changed").doesNotContain(beto.id());
		assertThat(stream(anasStream)).contains("event:members-changed");
		assertThat(subscriptions.subscriberCount(UUID.fromString(listId))).isEqualTo(1);
	}

	@Test
	void deletingTheListClosesEveryStream() throws Exception {
		MvcResult betoStream = subscribe(beto);

		as(ana, delete("/api/lists/" + listId)).andExpect(status().isNoContent());

		assertThat(stream(betoStream)).contains("event:list-deleted");
		assertThat(subscriptions.subscriberCount(UUID.fromString(listId))).isZero();
	}

	// --- utilidades ---

	private MvcResult subscribe(TestUser user) throws Exception {
		return as(user, get(events()).accept(MediaType.TEXT_EVENT_STREAM))
			.andExpect(request().asyncStarted())
			.andReturn();
	}

	private static String stream(MvcResult result) throws Exception {
		return result.getResponse().getContentAsString();
	}

	private String events() {
		return "/api/lists/" + listId + "/events";
	}

	private String items() {
		return "/api/lists/" + listId + "/items";
	}

	private ResultActions as(TestUser user, MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header(HttpHeaders.AUTHORIZATION, user.bearer()));
	}

	private ResultActions as(TestUser user, MockHttpServletRequestBuilder request, String json) throws Exception {
		return as(user, request.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private static String body(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString();
	}

}
