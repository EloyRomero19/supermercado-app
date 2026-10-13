package com.miapp.backend.item;

import java.time.Instant;
import java.util.UUID;

import com.miapp.backend.user.AppUser;

/** categoryId/Name/Order son null en los productos escritos a mano (el frontend los agrupa en "Otros"). */
public record ItemDto(
		UUID id,
		Long productId,
		String name,
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

	static ItemDto from(ListItem item) {
		var product = item.getProduct();
		var category = product != null ? product.getCategory() : null;
		return new ItemDto(item.getId(), product != null ? product.getId() : null, item.displayName(),
				category != null ? category.getId() : null, category != null ? category.getName() : null,
				category != null ? category.getSortOrder() : null, item.getQuantity(), item.getNote(), item.isChecked(),
				nameOf(item.getCheckedBy()), item.getCheckedAt(), nameOf(item.getAddedBy()), item.getCreatedAt());
	}

	private static String nameOf(AppUser user) {
		return user != null ? user.getDisplayName() : null;
	}

}
