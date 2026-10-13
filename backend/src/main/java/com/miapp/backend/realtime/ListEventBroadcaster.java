package com.miapp.backend.realtime;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.miapp.backend.common.ListEvent;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
class ListEventBroadcaster {

	private final ListSubscriptions subscriptions;

	/**
	 * AFTER_COMMIT: Spring guarda el evento y solo llama aquí si la transacción se confirma.
	 * Si fallara (p. ej. un 409 por edición concurrente), nadie recibe un cambio que no existe.
	 */
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	void onListEvent(ListEvent event) {
		subscriptions.publish(event);
	}

}
