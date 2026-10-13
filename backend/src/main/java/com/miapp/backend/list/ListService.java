package com.miapp.backend.list;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.common.ListEvent;
import com.miapp.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ListService {

	private final ShoppingListRepository lists;
	private final ListMemberRepository members;
	private final ListAccessService access;
	private final UserRepository users;
	private final InviteCodeGenerator inviteCodes;
	private final ApplicationEventPublisher events;

	@Transactional(readOnly = true)
	public List<ListSummary> myLists(UUID userId) {
		return members.findSummariesByUserId(userId);
	}

	@Transactional
	public ListDetail create(UUID userId, String name) {
		ShoppingList list = lists.save(new ShoppingList(name.trim(), newInviteCode()));
		// getReferenceById no consulta la BD: basta con el id para crear la relación
		members.save(new ListMember(list, users.getReferenceById(userId), ListRole.OWNER));
		return detail(list, ListRole.OWNER);
	}

	@Transactional(readOnly = true)
	public ListDetail get(UUID listId, UUID userId) {
		ListMember me = access.requireMember(listId, userId);
		return detail(me.getList(), me.getRole());
	}

	@Transactional
	public ListDetail rename(UUID listId, UUID userId, String name) {
		ListMember me = access.requireOwner(listId, userId);
		// Entidad gestionada: basta con cambiarla, Hibernate hace el UPDATE al terminar la transacción
		me.getList().setName(name.trim());
		events.publishEvent(ListEvent.of(listId, ListEvent.LIST_RENAMED, Map.of("name", me.getList().getName())));
		return detail(me.getList(), me.getRole());
	}

	@Transactional
	public void delete(UUID listId, UUID userId) {
		access.requireOwner(listId, userId);
		lists.deleteListById(listId);
		events.publishEvent(ListEvent.of(listId, ListEvent.LIST_DELETED, Map.of()));
	}

	/** El código anterior deja de funcionar: útil si se ha compartido con quien no debía. */
	@Transactional
	public String regenerateInviteCode(UUID listId, UUID userId) {
		ShoppingList list = access.requireOwner(listId, userId).getList();
		list.setInviteCode(newInviteCode());
		events.publishEvent(ListEvent.of(listId, ListEvent.INVITE_CODE_CHANGED, Map.of("inviteCode", list.getInviteCode())));
		return list.getInviteCode();
	}

	/** Unirse es idempotente: si ya eras miembro, simplemente devuelve la lista. */
	@Transactional
	public ListDetail join(UUID userId, String code) {
		ShoppingList list = lists.findByInviteCode(InviteCodeGenerator.normalize(code))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "El código de invitación no es válido"));
		boolean joined = members.insertMemberIfAbsent(list.getId(), userId) == 1;
		if (joined) {
			publishMembersChanged(list.getId(), Set.of());
		}
		return get(list.getId(), userId);
	}

	/** Expulsar a otro (solo el propietario) o salir uno mismo (cualquiera). */
	@Transactional
	public void removeMember(UUID listId, UUID actingUserId, UUID targetUserId) {
		if (actingUserId.equals(targetUserId)) {
			leave(access.requireMember(listId, actingUserId));
			return;
		}
		access.requireOwner(listId, actingUserId);
		ListMember target = members.findById(new ListMemberId(listId, targetUserId))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ese usuario no es miembro de la lista"));
		members.delete(target);
		publishMembersChanged(listId, Set.of(targetUserId));
	}

	/** Si se va el propietario, hereda la lista el miembro más antiguo; si no queda nadie, se borra. */
	private void leave(ListMember me) {
		UUID listId = me.getId().getListId();
		UUID userId = me.getId().getUserId();
		if (!me.isOwner()) {
			members.delete(me);
			publishMembersChanged(listId, Set.of(userId));
			return;
		}
		var heir = members.findFirstByIdListIdAndIdUserIdNotOrderByJoinedAt(listId, userId);
		if (heir.isEmpty()) {
			lists.deleteListById(listId);
			events.publishEvent(ListEvent.of(listId, ListEvent.LIST_DELETED, Map.of()));
			return;
		}
		// Orden importante: Hibernate ejecuta los UPDATE antes que los DELETE al volcar los cambios.
		// Si no forzamos el borrado primero (flush), habría dos OWNER a la vez y el índice único
		// parcial list_member_one_owner_uk lo rechazaría.
		members.delete(me);
		members.flush();
		heir.get().setRole(ListRole.OWNER);
		publishMembersChanged(listId, Set.of(userId));
	}

	/**
	 * Se envía la lista completa de miembros (no "quién entró o salió"): así cada cliente
	 * deduce también su propio rol (p. ej. al heredar la lista) y si sigue siendo miembro.
	 */
	private void publishMembersChanged(UUID listId, Set<UUID> kickedUserIds) {
		List<MemberDto> current = members.findByListIdWithUser(listId).stream().map(MemberDto::from).toList();
		events.publishEvent(new ListEvent(listId, ListEvent.MEMBERS_CHANGED, Map.of("members", current), kickedUserIds));
	}

	private ListDetail detail(ShoppingList list, ListRole myRole) {
		List<MemberDto> memberDtos = members.findByListIdWithUser(list.getId()).stream().map(MemberDto::from).toList();
		return new ListDetail(list.getId(), list.getName(), list.getInviteCode(), myRole, memberDtos);
	}

	/** Las colisiones son casi imposibles, pero si ocurre se prueba otro código. */
	private String newInviteCode() {
		for (int attempt = 0; attempt < 5; attempt++) {
			String code = inviteCodes.generate();
			if (!lists.existsByInviteCode(code)) {
				return code;
			}
		}
		throw new IllegalStateException("No se pudo generar un código de invitación único");
	}

}
