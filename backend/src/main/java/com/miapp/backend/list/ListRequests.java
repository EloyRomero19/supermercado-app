package com.miapp.backend.list;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cuerpos de petición de la API de listas. */
final class ListRequests {

	private ListRequests() {
	}

	record ListName(
			@NotBlank(message = "El nombre es obligatorio")
			@Size(max = 100, message = "El nombre no puede superar 100 caracteres")
			String name) {
	}

	record Join(
			@NotBlank(message = "Escribe el código de invitación")
			@Size(max = 20, message = "El código no es válido")
			String code) {
	}

	record InviteCode(String inviteCode) {
	}

}
