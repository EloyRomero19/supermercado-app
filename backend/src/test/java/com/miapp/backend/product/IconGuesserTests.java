package com.miapp.backend.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.miapp.backend.product.IconGuesser.CatalogEntry;

/** Test unitario: catálogo y diccionario pequeños, sin Spring ni base de datos. */
class IconGuesserTests {

	static final List<CatalogEntry> CATALOG = List.of(
			new CatalogEntry("tomate", "🍅", (short) 1, "Frutas y verduras", (short) 1),
			new CatalogEntry("tomate frito", "🥫", (short) 7, "Despensa", (short) 7),
			new CatalogEntry("leche entera", "🥛", (short) 5, "Lácteos y huevos", (short) 5),
			new CatalogEntry("leche infantil", "🍼", (short) 13, "Bebé y mascotas", (short) 13),
			new CatalogEntry("papel higienico", "🧻", (short) 12, "Higiene y cuidado personal", (short) 12),
			new CatalogEntry("papel de aluminio", "🥡", (short) 11, "Limpieza", (short) 11),
			new CatalogEntry("huevos", "🥚", (short) 5, "Lácteos y huevos", (short) 5));

	static final Map<String, IconGuess> DICTIONARY = Map.of(
			"vela", new IconGuess("🕯️", null, null, null),
			"regalo", new IconGuess("🎁", null, null, null),
			"limon", new IconGuess("🍋", (short) 1, "Frutas y verduras", (short) 1),
			"arroz con leche", new IconGuess("🍮", (short) 5, "Lácteos y huevos", (short) 5));

	IconGuesser guesser = new IconGuesser(CATALOG, DICTIONARY);

	String icon(String text) {
		return guesser.guess(text).map(IconGuess::icon).orElse(null);
	}

	@Test
	void textStartingWithACatalogProductUsesIt() {
		assertThat(icon("Papel higiénico doble capa")).isEqualTo("🧻");
		assertThat(icon("Tomate frito casero")).isEqualTo("🥫");
	}

	@Test
	void pluralsAndAccentsAreIgnored() {
		assertThat(icon("Tomates cherry")).isEqualTo("🍅");
		assertThat(icon("LIMONES")).isEqualTo("🍋");
		assertThat(icon("Huevo de pato")).isEqualTo("🥚");
	}

	@Test
	void ambiguousFirstWordsWithoutABaseProductAreSkipped() {
		// "leche" puede ser 🥛 o 🍼 y no hay producto "leche" a secas: decide la siguiente palabra
		assertThat(icon("Leche y velas")).isEqualTo("🕯️");
		// "papel" igual: "Papel de regalo" no es papel higiénico ni de aluminio
		assertThat(icon("Papel de regalo")).isEqualTo("🎁");
	}

	@Test
	void multiWordExpressionsAndStopWords() {
		assertThat(icon("Arroz con leche de la abuela")).isEqualTo("🍮");
		assertThat(icon("Velas de cumpleaños")).isEqualTo("🕯️");
	}

	@Test
	void keepsTheSectionWhenKnown() {
		assertThat(guesser.guess("Tomates cherry")).get()
			.extracting(IconGuess::categoryName, IconGuess::categoryOrder)
			.containsExactly("Frutas y verduras", (short) 1);
		assertThat(guesser.guess("Velas")).get().extracting(IconGuess::categoryName).isNull();
	}

	@Test
	void unknownTextHasNoGuess() {
		assertThat(guesser.guess("Xyzzy 42")).isEmpty();
		assertThat(guesser.guess("   ")).isEmpty();
	}

	@Test
	void singularForms() {
		assertThat(IconGuesser.forms("limones")).containsExactly("limones", "limone", "limon");
		assertThat(IconGuesser.forms("pan")).containsExactly("pan");
	}

}
