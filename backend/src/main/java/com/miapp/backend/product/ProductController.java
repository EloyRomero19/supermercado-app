package com.miapp.backend.product;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
class ProductController {

	private final ProductService productService;

	/** Las anotaciones de validación en los parámetros las comprueba Spring MVC y devuelve 400 si fallan. */
	@GetMapping("/api/products")
	List<ProductDto> search(
			@RequestParam @Size(max = 50, message = "La búsqueda no puede superar 50 caracteres") String q,
			@RequestParam(defaultValue = "10") @Min(1) @Max(20) int limit) {
		return productService.search(q, limit);
	}

	@GetMapping("/api/categories")
	List<CategoryDto> categories() {
		return productService.categories();
	}

}
