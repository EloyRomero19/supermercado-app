package com.miapp.backend.user;

import java.util.UUID;

/** Lo que la API expone de un usuario (nunca la entidad: tiene el hash de la contraseña). */
public record UserDto(UUID id, String email, String displayName, String avatarUrl) {

	public static UserDto from(AppUser user) {
		return new UserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getAvatarUrl());
	}

}
