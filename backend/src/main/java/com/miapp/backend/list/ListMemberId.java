package com.miapp.backend.list;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Clave primaria compuesta (list_id, user_id). JPA exige equals/hashCode y Serializable. */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ListMemberId implements Serializable {

	private UUID listId;

	private UUID userId;

}
