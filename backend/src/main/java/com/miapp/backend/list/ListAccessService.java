package com.miapp.backend.list;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.miapp.backend.common.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Punto único de autorización sobre listas. TODA operación sobre una lista (o sus items, en
 * la Fase 7) pasa por aquí antes de hacer nada.
 */
@Service
@RequiredArgsConstructor
public class ListAccessService {

	private final ListMemberRepository members;

	/**
	 * 404 tanto si la lista no existe como si existe pero no eres miembro: así nadie puede
	 * averiguar qué listas existen probando ids.
	 */
	public ListMember requireMember(UUID listId, UUID userId) {
		return members.findById(new ListMemberId(listId, userId))
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lista no encontrada"));
	}

	/** Al miembro sí le podemos decir 403: ya sabe que la lista existe. */
	public ListMember requireOwner(UUID listId, UUID userId) {
		ListMember member = requireMember(listId, userId);
		if (!member.isOwner()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Solo el propietario de la lista puede hacer esto");
		}
		return member;
	}

}
