package com.miapp.backend.user;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Usuario de la app. Se llama AppUser (como la tabla) para no confundirse
 * con {@code org.springframework.security.core.userdetails.User}.
 * Los nombres de columna se derivan solos: displayName → display_name.
 */
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA necesita un constructor vacío
public class AppUser {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private String email;

	private String displayName;

	private String passwordHash;

	private String googleSub;

	private String avatarUrl;

	@CreationTimestamp
	private Instant createdAt;

	public AppUser(String email, String displayName, String passwordHash) {
		this.email = email;
		this.displayName = displayName;
		this.passwordHash = passwordHash;
	}

	public static AppUser fromGoogle(String email, String displayName, String googleSub, String avatarUrl) {
		AppUser user = new AppUser(email, displayName, null);
		user.googleSub = googleSub;
		user.avatarUrl = avatarUrl;
		return user;
	}

}
