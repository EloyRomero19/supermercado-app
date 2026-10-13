package com.miapp.backend;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Arranca un PostgreSQL desechable en Docker para los tests.
 * {@code @ServiceConnection} hace que Spring use este contenedor como datasource,
 * ignorando la configuración de application.yml.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	PostgreSQLContainer postgresContainer() {
		// Misma versión que docker-compose.yml para que los tests prueben lo mismo que usamos
		return new PostgreSQLContainer("postgres:18-alpine");
	}

}
