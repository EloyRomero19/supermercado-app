package com.miapp.backend.product;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Adivina el icono (y la sección) de un producto escrito a mano: "Tomates cherry" → 🍅 en
 * Frutas y verduras, "Velas de cumpleaños" → 🕯️. Es lógica pura, sin Spring ni base de datos:
 * recibe el catálogo y el diccionario ya cargados (ver CustomItemIcons).
 *
 * Orden de búsqueda:
 * 1. El texto empieza por el nombre de un producto del catálogo ("Papel higiénico doble capa").
 * 2. Contiene una expresión de varias palabras del diccionario ("arroz con leche").
 * 3. Palabra a palabra, en orden (en español lo importante suele ir primero: "leche DE COCO"),
 *    se busca cada palabra en singular y en plural en el catálogo y luego en el diccionario.
 */
final class IconGuesser {

	record CatalogEntry(String searchName, String icon, short categoryId, String categoryName, short categoryOrder) {

		IconGuess toGuess() {
			return new IconGuess(icon, categoryId, categoryName, categoryOrder);
		}

	}

	private static final Set<String> STOP_WORDS = Set.of("de", "del", "la", "las", "el", "los", "con", "sin", "para",
			"y", "o", "a", "al", "en", "un", "una", "unos", "unas", "por", "mi", "tu", "su", "muy", "mas");

	private final List<CatalogEntry> longestNameFirst;
	private final Map<String, CatalogEntry> heads;
	private final Map<String, IconGuess> words;
	private final Map<String, IconGuess> phrases;

	IconGuesser(List<CatalogEntry> catalog, Map<String, IconGuess> dictionary) {
		this.longestNameFirst = catalog.stream()
			.sorted(Comparator.comparingInt((CatalogEntry e) -> e.searchName().length()).reversed())
			.toList();
		this.heads = indexHeads(catalog);
		this.words = new HashMap<>();
		this.phrases = new LinkedHashMap<>();
		dictionary.forEach((key, guess) -> (key.contains(" ") ? phrases : words).put(key, guess));
	}

	Optional<IconGuess> guess(String text) {
		String normalized = ProductService.normalize(text);
		if (normalized.isEmpty()) {
			return Optional.empty();
		}
		for (CatalogEntry entry : longestNameFirst) {
			if (normalized.equals(entry.searchName()) || normalized.startsWith(entry.searchName() + " ")) {
				return Optional.of(entry.toGuess());
			}
		}
		String padded = " " + normalized + " ";
		for (var phrase : phrases.entrySet()) {
			if (padded.contains(" " + phrase.getKey() + " ")) {
				return Optional.of(phrase.getValue());
			}
		}
		for (String word : normalized.split(" ")) {
			if (word.length() < 2 || STOP_WORDS.contains(word) || word.chars().allMatch(Character::isDigit)) {
				continue;
			}
			for (String form : forms(word)) {
				if (heads.containsKey(form)) {
					return Optional.of(heads.get(form).toGuess());
				}
				if (words.containsKey(form)) {
					return Optional.of(words.get(form));
				}
			}
		}
		return Optional.empty();
	}

	/** La palabra tal cual y sus posibles singulares: "limones" → limones, limone, limon. */
	static List<String> forms(String word) {
		List<String> forms = new ArrayList<>(List.of(word));
		if (word.endsWith("s") && word.length() > 3) {
			forms.add(word.substring(0, word.length() - 1));
		}
		if (word.endsWith("es") && word.length() > 4) {
			forms.add(word.substring(0, word.length() - 2));
		}
		return forms;
	}

	/**
	 * Primera palabra de cada producto del catálogo → producto. Si varios productos empiezan igual
	 * con iconos distintos ("tomate" 🍅, "tomate frito" 🥫) gana el que se llama solo así ("tomate");
	 * si no hay ninguno ("leche entera", "leche infantil"…), la palabra es ambigua y no se usa.
	 */
	private static Map<String, CatalogEntry> indexHeads(List<CatalogEntry> catalog) {
		Map<String, List<CatalogEntry>> byHead = new HashMap<>();
		for (CatalogEntry entry : catalog) {
			String head = entry.searchName().split(" ")[0];
			for (String form : forms(head)) {
				byHead.computeIfAbsent(form, k -> new ArrayList<>()).add(entry);
			}
		}
		Map<String, CatalogEntry> heads = new HashMap<>();
		byHead.forEach((head, entries) -> {
			List<CatalogEntry> shortestFirst = entries.stream()
				.sorted(Comparator.comparingInt(e -> e.searchName().length()))
				.toList();
			boolean sameIcon = shortestFirst.stream().map(CatalogEntry::icon).distinct().count() == 1;
			List<CatalogEntry> singleWord = shortestFirst.stream().filter(e -> !e.searchName().contains(" ")).toList();
			if (sameIcon) {
				heads.put(head, shortestFirst.get(0));
			}
			else if (singleWord.size() == 1) {
				heads.put(head, singleWord.get(0));
			}
		});
		return heads;
	}

}
