package com.miapp.backend.user;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<AppUser, UUID> {

	// lower(email) coincide con el índice único app_user_email_lower_uk, así Postgres lo usa
	@Query("select u from AppUser u where lower(u.email) = lower(:email)")
	Optional<AppUser> findByEmailIgnoreCase(String email);

	Optional<AppUser> findByGoogleSub(String googleSub);

}
