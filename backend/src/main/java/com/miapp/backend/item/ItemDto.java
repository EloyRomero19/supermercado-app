package com.miapp.backend.item;

import java.time.Instant;
import java.util.UUID;

import com.miapp.backend.product.CustomItemIcons;
import com.miapp.backend.user.AppUser;

/** En los productos escritos a mano, icon y la sección se deducen del texto; null si no se reconoce. */
public record ItemDto(
		UUID id,
		Long productId,
		String name,
		String icon,
		Short categoryId,
		String categoryName,
		Short categoryOrder,
		short quantity,
		String note,
		boolean checked,
		String checkedByName,
		Instant checkedAt,
		String addedByName,
		Instant createdAt) {

	static ItemDto from(ListItem item, CustomItemIcons customIcons) {
		var product = item.getProduct();
		if (product != null) {
			var category = product.getCategory();
			return new ItemDto(item.getId(), product.getId(), product.getName(), product.getIcon(), category.getId(),
					category.getName(), category.getSortOrder(), item.getQuantity(), item.getNote(), item.isChecked(),
					nameOf(item.getCheckedBy()), item.getCheckedAt(), nameOf(item.getAddedBy()), item.getCreatedAt());
		}
		// Escrito a mano: el icono y la sección se deducen del texto (y se recalculan en cada lectura,
		// así las mejoras del diccionario se aplican también a los productos ya añadidos)
		var guess = customIcons.guess(item.getCustomName()).orElse(null);
		return new ItemDto(item.getId(), null, item.getCustomName(), guess != null ? guess.icon() : null,
				guess != null ? guess.categoryId() : null, guess != null ? guess.categoryName() : null,
				guess != null ? guess.categoryOrder() : null, item.getQuantity(), item.getNote(), item.isChecked(),
				nameOf(item.getCheckedBy()), item.getCheckedAt(), nameOf(item.getAddedBy()), item.getCreatedAt());
	}

	private static String nameOf(AppUser user) {
		return user != null ? user.getDisplayName() : null;
	}

}
