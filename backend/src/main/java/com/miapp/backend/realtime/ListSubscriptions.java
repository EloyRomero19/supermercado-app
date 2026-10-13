package com.miapp.backend.realtime;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder;

import com.miapp.backend.common.ListEvent;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

/**
 * Conexiones SSE abiertas, agrupadas por lista. Vive en memoria: con varias instancias del
 * backend habría que repartir los eventos entre ellas (p. ej. con LISTEN/NOTIFY de Postgres).
 */
@Slf4j
@Component
class ListSubscriptions {

	/**
	 * Cada conexión se cierra a los 15 min y el cliente reconecta solo. Así se vuelve a comprobar
	 * que sigue siendo miembro con un token vigente (el access token también dura 15 min).
	 */
	static final Duration TIMEOUT = Duration.ofMinutes(15);

	private record Subscription(UUID userId, SseEmitter emitter) {
	}

	private final Map<UUID, Set<Subscription>> byList = new ConcurrentHashMap<>();

	SseEmitter subscribe(UUID listId, UUID userId) {
		SseEmitter emitter = new SseEmitter(TIMEOUT.toMillis());
		Subscription subscription = new Subscription(userId, emitter);
		// compute es atómico por clave: no se pierde una suscripción si otra se borra a la vez
		byList.compute(listId, (id, set) -> {
			Set<Subscription> subscriptions = set != null ? set : ConcurrentHashMap.newKeySet();
			subscriptions.add(subscription);
			return subscriptions;
		});
		Runnable remove = () -> unsubscribe(listId, subscription);
		emitter.onCompletion(remove);
		emitter.onTimeout(remove);
		emitter.onError(error -> remove.run());
		// Primer evento: hace que las cabeceras salgan ya y el cliente sepa que está conectado
		send(listId, subscription, SseEmitter.event().name("ready").data("{}", MediaType.APPLICATION_JSON));
		return emitter;
	}

	void publish(ListEvent event) {
		for (Subscription subscription : byList.getOrDefault(event.listId(), Set.of())) {
			send(event.listId(), subscription,
					SseEmitter.event().name(event.type()).data(event.data(), MediaType.APPLICATION_JSON));
			if (event.deletesList() || event.kickedUserIds().contains(subscription.userId())) {
				// Se quita ya del registro: onCompletion llegaría más tarde, y mientras tanto podría
				// recibir eventos de una lista a la que ya no pertenece
				unsubscribe(event.listId(), subscription);
				subscription.emitter().complete();
			}
		}
	}

	/**
	 * Un comentario SSE (": ping") cada 25 s. Evita que proxies y routers cierren la conexión
	 * por inactividad y detecta clientes que se fueron sin avisar (el envío falla).
	 */
	@Scheduled(fixedRate = 25, timeUnit = TimeUnit.SECONDS)
	void heartbeat() {
		byList.forEach((listId, subscriptions) -> subscriptions
			.forEach(subscription -> send(listId, subscription, SseEmitter.event().comment("ping"))));
	}

	int subscriberCount(UUID listId) {
		return byList.getOrDefault(listId, Set.of()).size();
	}

	/** Al apagar el servidor, cerrar las conexiones para no retrasar el apagado. */
	@PreDestroy
	void closeAll() {
		byList.values().forEach(subscriptions -> subscriptions.forEach(subscription -> subscription.emitter().complete()));
	}

	private void send(UUID listId, Subscription subscription, SseEventBuilder event) {
		try {
			subscription.emitter().send(event);
		}
		catch (IOException | IllegalStateException ex) {
			// El cliente cerró la pestaña o perdió la conexión: no es un error del servidor
			log.debug("Conexión SSE perdida en la lista {}", listId);
			unsubscribe(listId, subscription);
		}
	}

	private void unsubscribe(UUID listId, Subscription subscription) {
		byList.computeIfPresent(listId, (id, subscriptions) -> {
			subscriptions.remove(subscription);
			return subscriptions.isEmpty() ? null : subscriptions;
		});
	}

}
