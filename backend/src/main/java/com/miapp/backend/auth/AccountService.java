package com.miapp.backend.auth;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.list.ListService;
import com.miapp.backend.user.AppUser;
import com.miapp.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

/** Borrar la cuenta (derecho de supresión del RGPD): el usuario y todo lo que es solo suyo. */
@Service
@RequiredArgsConstructor
class AccountService {

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final ListService lists;

	/**
	 * Se pide la contraseña aunque haya sesión: con el móvil desbloqueado en manos de otro, o con
	 * un token robado, no debería poder borrarse una cuenta. Todo en una transacción: si algo
	 * falla, no se ha borrado nada.
	 */
	@Transactional
	void delete(UUID userId, String password) {
		AppUser user = users.findById(userId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
		// BCrypt solo mira los primeros 72 bytes; más largo no puede ser su contraseña
		boolean passwordMatches = user.getPasswordHash() != null
				&& password.getBytes(StandardCharsets.UTF_8).length <= 72
				&& passwordEncoder.matches(password, user.getPasswordHash());
		if (!passwordMatches) {
			// 403 y no 401: un 401 haría que el frontend creyera que la sesión ha caducado
			throw new ApiException(HttpStatus.FORBIDDEN, "La contraseña no es correcta");
		}

		lists.leaveAll(userId);
		// Con SQL directo y no con users.delete(user): Hibernate aún tiene en memoria las filas de
		// list_member que acabamos de procesar, que apuntan a este usuario, y se negaría a borrarlo.
		// El resto lo hace la BD: sus sesiones se borran (ON DELETE CASCADE) y en los productos de
		// listas compartidas desaparece su nombre de "lo añadió"/"lo cogió" (ON DELETE SET NULL).
		users.deleteUserById(userId);
	}

}
