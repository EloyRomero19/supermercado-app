package com.miapp.backend.recipe;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miapp.backend.common.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Recetario de solo lectura. No necesita servicio propio: no hay reglas de negocio ni permisos más
 * allá de estar autenticado (las recetas son las mismas para todos).
 */
@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
class RecipeController {

	private final RecipeRepository recipes;

	@GetMapping
	List<RecipeSummary> all() {
		return recipes.findAll();
	}

	@GetMapping("/{recipeId}")
	RecipeDetail one(@PathVariable short recipeId) {
		return recipes.findById(recipeId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Esa receta no existe"));
	}

}
