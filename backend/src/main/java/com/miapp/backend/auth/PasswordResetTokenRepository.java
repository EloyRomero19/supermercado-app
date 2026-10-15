package com.miapp.backend.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

	// FOR UPDATE: si el mismo enlace se usa dos veces a la vez, la segunda espera y lo verá ya gastado
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<PasswordResetToken> findByTokenHash(String tokenHash);

	long countByUserIdAndCreatedAtAfter(UUID userId, Instant since);

	@Modifying
	@Query("update PasswordResetToken t set t.usedAt = :now where t.user.id = :userId and t.usedAt is null")
	void invalidateAllForUser(UUID userId, Instant now);

}
