package com.miapp.backend.recipe;

import java.util.List;

/** Una receta completa: sus ingredientes (productos del catálogo) y sus pasos. */
public record RecipeDetail(short id, String name, String emoji, String description, short minutes, short servings,
		String difficulty, List<Ingredient> ingredients, List<String> steps) {

	/** Un ingrediente es un producto del catálogo más la cantidad que pide la receta. */
	public record Ingredient(long productId, String name, String icon, Short categoryId, String categoryName,
			Short categoryOrder, String amount) {
	}

}
