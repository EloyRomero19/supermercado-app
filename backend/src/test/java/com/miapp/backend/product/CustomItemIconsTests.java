package com.miapp.backend.product;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.miapp.backend.TestcontainersConfiguration;

/** Con el catálogo real (migraciones) y el diccionario real (custom-item-icons.txt). */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class CustomItemIconsTests {

	@Autowired
	CustomItemIcons customIcons;

	@ParameterizedTest(name = "{0} → {1}")
	@CsvSource(nullValues = "-", value = {
			"Tomates cherry,              🍅, Frutas y verduras",
			"Leche de coco,               🥛, Lácteos y huevos",
			"Yogur de coco,               🥣, Lácteos y huevos",
			"Papel higiénico doble capa,  🧻, Higiene y cuidado personal",
			"Papel de regalo,             🎁, -",
			"Velas de cumpleaños,         🕯️, -",
			"Pilas AA,                    🔋, -",
			"Cerezas del Jerte,           🍒, Frutas y verduras",
			"Sushi,                       🍣, Congelados",
			"Pan de pueblo,               🍞, Panadería y bollería",
			"Aceite de coco,              🫒, Despensa",
			"Ibuprofeno 600,              💊, Higiene y cuidado personal",
			"Langostinos cocidos,         🦐, Pescadería",
			"Comida para hámster,         🍽️, -",
	})
	void guessesAnIconThatMakesSense(String text, String icon, String category) {
		assertThat(customIcons.guess(text)).get()
			.extracting(IconGuess::icon, IconGuess::categoryName)
			.containsExactly(icon, category);
	}

	@ParameterizedTest
	@CsvSource({ "Xyzzy", "Cosa rara 123" })
	void unknownTextHasNoGuess(String text) {
		assertThat(customIcons.guess(text)).isEmpty();
	}

}
