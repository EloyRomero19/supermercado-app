package com.miapp.backend;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comprueba que las restricciones del esquema (Flyway) protegen los datos
 * aunque el código Java tuviera un fallo.
 * {@code @Transactional} deshace cada test al terminar, así no se ensucian entre ellos.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class MigrationsTests {

	@Autowired
	JdbcTemplate jdbc;

	@Test
	void emailIsUniqueIgnoringCase() {
		jdbc.update("insert into app_user (email, display_name, password_hash) values ('ana@mail.com', 'Ana', 'x')");

		assertThatThrownBy(() -> jdbc.update(
				"insert into app_user (email, display_name, password_hash) values ('ANA@mail.com', 'Ana 2', 'x')"))
			.isInstanceOf(DataIntegrityViolationException.class)
			.hasMessageContaining("app_user_email_lower_uk");
	}

}
