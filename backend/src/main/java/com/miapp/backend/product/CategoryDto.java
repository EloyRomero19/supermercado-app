package com.miapp.backend.product;

public record CategoryDto(Short id, String name, short sortOrder) {

	static CategoryDto from(Category category) {
		return new CategoryDto(category.getId(), category.getName(), category.getSortOrder());
	}

}
