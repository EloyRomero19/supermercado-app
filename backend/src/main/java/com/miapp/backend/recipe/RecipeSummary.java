package com.miapp.backend.recipe;

/** Una receta en el recetario (sin ingredientes ni pasos). */
public record RecipeSummary(short id, String name, String emoji, String description, short minutes, short servings,
		String difficulty, long ingredientCount) {
}
