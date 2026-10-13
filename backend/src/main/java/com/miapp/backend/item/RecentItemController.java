package com.miapp.backend.item;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.miapp.backend.auth.CurrentUserId;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
class RecentItemController {

	private final ItemService itemService;

	/** Lo último que se ha añadido a la lista (aunque ya no esté), lo más reciente primero. */
	@GetMapping("/api/lists/{listId}/recent")
	List<RecentItemDto> recent(@CurrentUserId UUID userId, @PathVariable UUID listId) {
		return itemService.recent(listId, userId);
	}

}
