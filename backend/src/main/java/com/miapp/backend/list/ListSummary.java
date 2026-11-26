package com.miapp.backend.list;

import java.util.UUID;

/** Una lista en "mis listas": cuántos miembros tiene y cuántos productos faltan (itemCount). */
public record ListSummary(UUID id, String name, ListRole myRole, long memberCount, long itemCount) {
}
