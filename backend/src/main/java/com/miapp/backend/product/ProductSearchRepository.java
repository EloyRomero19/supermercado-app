package com.miapp.backend.product;

import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/**
 * Búsquedas con SQL nativo (JdbcClient): los operadores de pg_trgm no existen en JPQL.
 * Recibe el texto ya normalizado (minúsculas, sin tildes, solo letras/números/espacios),
 * así que no puede contener los comodines de LIKE (% y _).
 */
@Repository
@RequiredArgsConstructor
class ProductSearchRepository {

	private static final String SELECT_PRODUCT = """
			SELECT p.id, p.name, c.id AS category_id, c.name AS category_name
			FROM product p
			JOIN category c ON c.id = p.category_id
			""";

	private final JdbcClient jdbc;

	/** Productos con alguna palabra que empieza por el texto: "pollo" → "Pechuga de pollo". */
	List<ProductDto> findByWordPrefix(String normalizedQuery, int limit) {
		return jdbc.sql(SELECT_PRODUCT + """
				WHERE p.search_name LIKE :prefix OR p.search_name LIKE :wordPrefix
				ORDER BY p.search_name LIKE :prefix DESC,
				         word_similarity(:q, p.search_name) DESC,
				         p.name
				LIMIT :limit
				""")
			.param("q", normalizedQuery)
			.param("prefix", normalizedQuery + "%")
			.param("wordPrefix", "% " + normalizedQuery + "%")
			.param("limit", limit)
			.query(ProductDto.class)
			.list();
	}

	/**
	 * Productos parecidos, para erratas: "tomte" → "Tomate".
	 * word_similarity compara el texto con el trozo más parecido del nombre (0 = nada, 1 = idéntico).
	 * El operador <% usa el índice GIN y filtra con un umbral que por defecto es 0.6, demasiado
	 * exigente para palabras cortas; SET LOCAL lo cambia solo para la transacción actual.
	 */
	List<ProductDto> findSimilar(String normalizedQuery, int limit) {
		jdbc.sql("SET LOCAL pg_trgm.word_similarity_threshold = 0.4").update();
		return jdbc.sql(SELECT_PRODUCT + """
				WHERE :q <% p.search_name
				ORDER BY word_similarity(:q, p.search_name) DESC, p.name
				LIMIT :limit
				""")
			.param("q", normalizedQuery)
			.param("limit", limit)
			.query(ProductDto.class)
			.list();
	}

}
