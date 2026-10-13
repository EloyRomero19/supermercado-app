package com.miapp.backend.list;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.domain.Persistable;

import com.miapp.backend.user.AppUser;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Implementa Persistable porque su clave la asignamos nosotros (no la genera la BD): sin esto,
 * Spring Data vería un id ya relleno, supondría que la fila existe y haría SELECT + merge
 * en lugar de un INSERT directo.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ListMember implements Persistable<ListMemberId> {

	@EmbeddedId
	private ListMemberId id;

	// @MapsId: la relación reutiliza la columna de la clave (list_id) en vez de tener otra
	@MapsId("listId")
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	private ShoppingList list;

	@MapsId("userId")
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	private AppUser user;

	// Se guarda como texto ('OWNER'), no como número: añadir valores al enum no rompe los datos
	@Setter
	@Enumerated(EnumType.STRING)
	private ListRole role;

	@CreationTimestamp
	private Instant joinedAt;

	@Transient
	private boolean isNew;

	ListMember(ShoppingList list, AppUser user, ListRole role) {
		this.id = new ListMemberId(list.getId(), user.getId());
		this.list = list;
		this.user = user;
		this.role = role;
		this.isNew = true;
	}

	@Override
	public boolean isNew() {
		return isNew;
	}

	@PostPersist
	@PostLoad
	void markNotNew() {
		this.isNew = false;
	}

	public boolean isOwner() {
		return role == ListRole.OWNER;
	}

}
