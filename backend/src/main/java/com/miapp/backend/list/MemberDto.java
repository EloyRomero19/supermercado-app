package com.miapp.backend.list;

import java.util.UUID;

public record MemberDto(UUID userId, String displayName, ListRole role) {

	static MemberDto from(ListMember member) {
		return new MemberDto(member.getUser().getId(), member.getUser().getDisplayName(), member.getRole());
	}

}
