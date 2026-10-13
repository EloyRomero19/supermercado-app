package com.miapp.backend.item;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface ListItemRepository extends JpaRepository<ListItem, UUID> {

	/** Todo lo que necesita ItemDto en una consulta (sin N+1): producto, categoría y usuarios. */
	@Query("""
			select i from ListItem i
			left join fetch i.product p
			left join fetch p.category
			left join fetch i.checkedBy
			left join fetch i.addedBy
			where i.list.id = :listId
			""")
	List<ListItem> findAllForList(UUID listId);

	/**
	 * Buscar SIEMPRE por (id, listId), nunca solo por id. Si no, un miembro de la lista A podría
	 * modificar un item de la lista B mandando su id en la URL de A (vulnerabilidad IDOR).
	 */
	Optional<ListItem> findByIdAndListId(UUID id, UUID listId);

	Optional<ListItem> findFirstByListIdAndProductIdAndCheckedFalse(UUID listId, Long productId);

	@Query("select i from ListItem i where i.list.id = :listId and i.checked = false and lower(i.customName) = lower(:name)")
	Optional<ListItem> findUncheckedCustom(UUID listId, String name);

	/**
	 * DELETE ... RETURNING (de Postgres): borra y devuelve los ids borrados en una sola sentencia
	 * atómica, sin el hueco que habría entre un SELECT y un DELETE separados.
	 */
	@Query(value = "delete from list_item where list_id = :listId and checked returning id", nativeQuery = true)
	List<UUID> deleteCheckedReturningIds(UUID listId);

}
