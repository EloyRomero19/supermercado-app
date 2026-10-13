package com.miapp.backend.product;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

	private final ProductSearchRepository searchRepository;
	private final CategoryRepository categories;

	/** Primero coincidencias por palabra; solo si no hay ninguna, productos parecidos (erratas). */
	@Transactional(readOnly = true) // findSimilar necesita transacción para el SET LOCAL
	public List<ProductDto> search(String query, int limit) {
		String normalized = normalize(query);
		if (normalized.isEmpty()) {
			return List.of();
		}
		List<ProductDto> byWord = searchRepository.findByWordPrefix(normalized, limit);
		return byWord.isEmpty() ? searchRepository.findSimilar(normalized, limit) : byWord;
	}

	@Transactional(readOnly = true)
	public List<CategoryDto> categories() {
		return categories.findAllByOrderBySortOrder().stream().map(CategoryDto::from).toList();
	}

	/**
	 * Igual que lower(unaccent(name)) en la migración: "  PLÁTANO!! " → "platano".
	 * NFD separa cada letra de su tilde ("á" → "a" + "´") y \p{M} elimina esas marcas.
	 */
	static String normalize(String text) {
		String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
		return withoutAccents.toLowerCase(Locale.ROOT)
			.replaceAll("[^a-z0-9 ]", " ")
			.trim()
			.replaceAll("\\s+", " ");
	}

}
