package com.miapp.backend.realtime;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.miapp.backend.auth.CurrentUserId;
import com.miapp.backend.list.ListAccessService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
class ListEventsController {

	private final ListAccessService access;
	private final ListSubscriptions subscriptions;

	/**
	 * Server-Sent Events: la respuesta HTTP no termina; el servidor va escribiendo eventos
	 * ("event: item-saved\ndata: {...}\n\n") por la misma conexión cuando ocurren.
	 * Devolver SseEmitter libera el hilo de Tomcat mientras la conexión sigue abierta.
	 */
	@GetMapping(path = "/api/lists/{listId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	SseEmitter subscribe(@CurrentUserId UUID userId, @PathVariable UUID listId) {
		access.requireMember(listId, userId);
		return subscriptions.subscribe(listId, userId);
	}

}
