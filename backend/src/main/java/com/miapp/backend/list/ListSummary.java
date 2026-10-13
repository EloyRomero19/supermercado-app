package com.miapp.backend.list;

import java.util.UUID;

/** Una lista en "mis listas". */
public record ListSummary(UUID id, String name, ListRole myRole, long memberCount) {
}
