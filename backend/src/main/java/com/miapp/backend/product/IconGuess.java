package com.miapp.backend.product;

/** Icono deducido para un producto escrito a mano y, si se sabe, su sección (para el color y el orden). */
public record IconGuess(String icon, Short categoryId, String categoryName, Short categoryOrder) {
}
