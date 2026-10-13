package com.miapp.backend.list;

import java.util.UUID;

/** Una lista en "mis listas", con su progreso: itemCount productos, checkedCount ya en el carro. */
public record ListSummary(UUID id, String name, ListRole myRole, long memberCount, long itemCount, long checkedCount) {
}
