package com.miapp.backend.list;

import java.util.List;
import java.util.UUID;

/** Una lista vista por uno de sus miembros. En la Fase 7 incluirá también los items. */
public record ListDetail(UUID id, String name, String inviteCode, ListRole myRole, List<MemberDto> members) {
}
