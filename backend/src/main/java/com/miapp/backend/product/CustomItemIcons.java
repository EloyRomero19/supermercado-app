package com.miapp.backend.product;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import com.miapp.backend.product.IconGuesser.CatalogEntry;

/**
 * Icono y sección para los productos escritos a mano. Carga el catálogo y el diccionario
 * (custom-item-icons.txt) la primera vez que se usa: el catálogo solo cambia con migraciones,
 * así que basta con leerlo una vez. No se hace al arrancar porque en ese momento Flyway podría
 * no haber creado todavía las tablas.
 */
@Component
public class CustomItemIcons {

	private static final String SIN_SECCION = "Sin sección";

	private final JdbcClient jdbc;
	private volatile IconGuesser guesser;

	CustomItemIcons(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public Optional<IconGuess> guess(String customName) {
		return guesser().guess(customName);
	}

	private IconGuesser guesser() {
		// "Double-checked locking": solo el primer hilo que llega construye el índice
		IconGuesser current = guesser;
		if (current == null) {
			synchronized (this) {
				if (guesser == null) {
					guesser = load();
				}
				current = guesser;
			}
		}
		return current;
	}

	private IconGuesser load() {
		List<CatalogEntry> catalog = jdbc.sql("""
				SELECT p.search_name, p.icon, c.id AS category_id, c.name AS category_name, c.sort_order AS category_order
				FROM product p JOIN category c ON c.id = p.category_id
				""").query(CatalogEntry.class).list();
		Map<String, IconGuess> categories = new LinkedHashMap<>();
		catalog.forEach(e -> categories.putIfAbsent(e.categoryName(), e.toGuess()));
		return new IconGuesser(catalog, readDictionary(categories));
	}

	/** Lee el diccionario. Una sección que no existe en la BD es un error: mejor fallar que ignorarla. */
	private static Map<String, IconGuess> readDictionary(Map<String, IconGuess> categories) {
		Map<String, IconGuess> dictionary = new LinkedHashMap<>();
		var resource = new ClassPathResource("custom-item-icons.txt");
		try (var reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
			IconGuess section = null;
			String line;
			while ((line = reader.readLine()) != null) {
				line = line.strip();
				if (line.isEmpty() || line.startsWith("#")) {
					continue;
				}
				if (line.startsWith("[") && line.endsWith("]")) {
					String name = line.substring(1, line.length() - 1);
					section = SIN_SECCION.equals(name) ? new IconGuess(null, null, null, null) : categories.get(name);
					if (section == null) {
						throw new IllegalStateException("Sección desconocida en custom-item-icons.txt: " + name);
					}
					continue;
				}
				String[] parts = line.split("=", 2);
				if (section == null || parts.length != 2) {
					throw new IllegalStateException("Línea no válida en custom-item-icons.txt: " + line);
				}
				dictionary.put(ProductService.normalize(parts[0]), new IconGuess(parts[1].strip(), section.categoryId(),
						section.categoryName(), section.categoryOrder()));
			}
		}
		catch (IOException ex) {
			throw new IllegalStateException("No se pudo leer custom-item-icons.txt", ex);
		}
		return dictionary;
	}

}
