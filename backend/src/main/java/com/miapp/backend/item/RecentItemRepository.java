package com.miapp.backend.item;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Historial de productos usados en cada lista (tabla list_recent_item, migración V6). */
@Repository
@RequiredArgsConstructor
class RecentItemRepository {

	/** Una fila del historial. Si es del catálogo trae su nombre, icono y sección; si no, customName. */
	record Row(Long productId, String customName, String productName, String icon, Short categoryId,
			String categoryName, Short categoryOrder, OffsetDateTime lastUsedAt) {
	}

	private final JdbcClient jdbc;

	/**
	 * "Upsert": inserta la fila o, si ya existía (conflicto con el índice único parcial),
	 * solo actualiza la fecha. Una sola sentencia atómica, sin "comprobar y luego insertar".
	 */
	void touchProduct(UUID listId, long productId) {
		jdbc.sql("""
				INSERT INTO list_recent_item (list_id, product_id) VALUES (:listId, :productId)
				ON CONFLICT (list_id, product_id) WHERE product_id IS NOT NULL
				DO UPDATE SET last_used_at = now(), times_used = list_recent_item.times_used + 1
				""")
			.param("listId", listId)
			.param("productId", productId)
			.update();
	}

	/** Igual para texto libre; "Pilas" y "pilas" son la misma fila y se queda la última forma escrita. */
	void touchCustom(UUID listId, String customName) {
		jdbc.sql("""
				INSERT INTO list_recent_item (list_id, custom_name) VALUES (:listId, :customName)
				ON CONFLICT (list_id, lower(custom_name)) WHERE custom_name IS NOT NULL
				DO UPDATE SET last_used_at = now(), times_used = list_recent_item.times_used + 1,
				              custom_name = EXCLUDED.custom_name
				""")
			.param("listId", listId)
			.param("customName", customName)
			.update();
	}

	List<Row> findRecent(UUID listId, int limit) {
		return jdbc.sql("""
				SELECT r.product_id, r.custom_name, p.name AS product_name, p.icon,
				       c.id AS category_id, c.name AS category_name, c.sort_order AS category_order, r.last_used_at
				FROM list_recent_item r
				LEFT JOIN product p ON p.id = r.product_id
				LEFT JOIN category c ON c.id = p.category_id
				WHERE r.list_id = :listId
				ORDER BY r.last_used_at DESC
				LIMIT :limit
				""")
			.param("listId", listId)
			.param("limit", limit)
			.query(Row.class)
			.list();
	}

}
