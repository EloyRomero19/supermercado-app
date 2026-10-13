package com.miapp.backend.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

	// SELECT ... FOR UPDATE: si llegan dos refresh con el mismo token a la vez, el segundo espera
	// al primero y lo verá ya revocado, en vez de rotarlo dos veces.
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<RefreshToken> findByTokenHash(String tokenHash);

	@Modifying
	@Query("update RefreshToken t set t.revokedAt = :now where t.familyId = :familyId and t.revokedAt is null")
	void revokeFamily(UUID familyId, Instant now);

	@Modifying
	@Query("update RefreshToken t set t.revokedAt = :now where t.user.id = :userId and t.revokedAt is null")
	void revokeAllForUser(UUID userId, Instant now);

}
