package com.miapp.backend.product;

public record ProductDto(Long id, String name, String icon, Short categoryId, String categoryName) {
}
