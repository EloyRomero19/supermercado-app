package com.miapp.backend.list;

import java.util.UUID;

public record MemberDto(UUID userId, String displayName, String avatarUrl, ListRole role) {

	static MemberDto from(ListMember member) {
		return new MemberDto(member.getUser().getId(), member.getUser().getDisplayName(),
				member.getUser().getAvatarUrl(), member.getRole());
	}

}
