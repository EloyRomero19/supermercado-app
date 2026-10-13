package com.miapp.backend.item;

import java.time.Instant;

/** Un producto usado recientemente en la lista: productId (del catálogo) o customName (texto libre). */
public record RecentItemDto(Long productId, String customName, String name, String icon, Short categoryId,
		String categoryName, Short categoryOrder, Instant lastUsedAt) {
}
