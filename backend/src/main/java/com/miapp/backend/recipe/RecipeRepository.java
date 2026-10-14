package com.miapp.backend.recipe;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Recetas (migración V7). Solo lectura, con SQL directo: no hace falta mapearlas como entidades JPA. */
@Repository
@RequiredArgsConstructor
class RecipeRepository {

	private record RecipeRow(short id, String name, String emoji, String description, short minutes, short servings,
			String difficulty, String steps) {
	}

	private final JdbcClient jdbc;

	List<RecipeSummary> findAll() {
		return jdbc.sql("""
				SELECT r.id, r.name, r.emoji, r.description, r.minutes, r.servings, r.difficulty,
				       (SELECT count(*) FROM recipe_ingredient i WHERE i.recipe_id = r.id) AS ingredient_count
				FROM recipe r
				ORDER BY r.sort_order
				""").query(RecipeSummary.class).list();
	}

	Optional<RecipeDetail> findById(short id) {
		return jdbc.sql("SELECT id, name, emoji, description, minutes, servings, difficulty, steps FROM recipe WHERE id = :id")
			.param("id", id)
			.query(RecipeRow.class)
			.optional()
			.map(r -> new RecipeDetail(r.id(), r.name(), r.emoji(), r.description(), r.minutes(), r.servings(),
					r.difficulty(), findIngredients(id), List.of(r.steps().split("\n"))));
	}

	private List<RecipeDetail.Ingredient> findIngredients(short recipeId) {
		return jdbc.sql("""
				SELECT p.id AS product_id, p.name, p.icon, c.id AS category_id, c.name AS category_name,
				       c.sort_order AS category_order, i.amount
				FROM recipe_ingredient i
				JOIN product p ON p.id = i.product_id
				JOIN category c ON c.id = p.category_id
				WHERE i.recipe_id = :recipeId
				ORDER BY i.position
				""").param("recipeId", recipeId).query(RecipeDetail.Ingredient.class).list();
	}

}
