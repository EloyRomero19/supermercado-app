package com.miapp.backend.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<AppUser, UUID> {

	// lower(email) coincide con el índice único app_user_email_lower_uk, así Postgres lo usa
	@Query("select u from AppUser u where lower(u.email) = lower(:email)")
	Optional<AppUser> findByEmailIgnoreCase(String email);

	/**
	 * Borrado directo en SQL; lo que cuelga del usuario lo resuelve la BD (ON DELETE CASCADE / SET NULL).
	 * flushAutomatically: antes, envía a la BD los cambios pendientes (p. ej. las salidas de sus listas).
	 * clearAutomatically: después, olvida las entidades cargadas, que podrían apuntar a filas ya borradas.
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from AppUser u where u.id = :id")
	void deleteUserById(UUID id);

}
