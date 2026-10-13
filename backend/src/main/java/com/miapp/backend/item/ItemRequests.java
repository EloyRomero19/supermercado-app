package com.miapp.backend.item;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

final class ItemRequests {

	private ItemRequests() {
	}

	/** Uno de los dos: productId (del catálogo) o customName (texto libre). */
	record Add(
			Long productId,
			@Size(max = 120, message = "El nombre no puede superar 120 caracteres") String customName,
			@Min(value = 1, message = "La cantidad mínima es 1")
			@Max(value = ListItem.MAX_QUANTITY, message = "La cantidad máxima es 999") Integer quantity,
			@Size(max = 200, message = "La nota no puede superar 200 caracteres") String note) {
	}

	/** PATCH: solo se cambian los campos que vienen (null = no tocar). Nota vacía = quitar la nota. */
	record Update(
			Boolean checked,
			@Min(value = 1, message = "La cantidad mínima es 1")
			@Max(value = ListItem.MAX_QUANTITY, message = "La cantidad máxima es 999") Integer quantity,
			@Size(max = 200, message = "La nota no puede superar 200 caracteres") String note) {
	}

}
