package com.miapp.backend.common;

import java.util.Set;
import java.util.UUID;

/**
 * Un cambio en una lista que hay que enviar en tiempo real a sus miembros conectados.
 * Los servicios lo publican con ApplicationEventPublisher dentro de su transacción; el envío
 * por SSE ocurre solo cuando la transacción se confirma (ver realtime.ListEventBroadcaster).
 * Vive en "common" para que list e item puedan publicarlo sin depender de realtime.
 *
 * @param data lo que recibe el cliente como JSON
 * @param kickedUserIds usuarios que ya no son miembros: reciben el evento y se les cierra la conexión
 */
public record ListEvent(UUID listId, String type, Object data, Set<UUID> kickedUserIds) {

	public static final String ITEM_SAVED = "item-saved";
	public static final String ITEMS_DELETED = "items-deleted";
	public static final String LIST_RENAMED = "list-renamed";
	public static final String INVITE_CODE_CHANGED = "invite-code-changed";
	public static final String MEMBERS_CHANGED = "members-changed";
	public static final String LIST_DELETED = "list-deleted";

	public static ListEvent of(UUID listId, String type, Object data) {
		return new ListEvent(listId, type, data, Set.of());
	}

	public boolean deletesList() {
		return LIST_DELETED.equals(type);
	}

}
