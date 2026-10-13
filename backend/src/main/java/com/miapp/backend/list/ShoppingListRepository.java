package com.miapp.backend.list;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

	Optional<ShoppingList> findByInviteCode(String inviteCode);

	boolean existsByInviteCode(String inviteCode);

	/** Borrado directo en SQL; los miembros caen solos por ON DELETE CASCADE. */
	@Modifying
	@Query("delete from ShoppingList l where l.id = :id")
	void deleteListById(UUID id);

}
