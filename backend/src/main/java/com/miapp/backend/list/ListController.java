package com.miapp.backend.list;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.miapp.backend.auth.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
class ListController {

	private final ListService listService;

	@GetMapping
	List<ListSummary> myLists(@CurrentUserId UUID userId) {
		return listService.myLists(userId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	ListDetail create(@CurrentUserId UUID userId, @Valid @RequestBody ListRequests.ListName request) {
		return listService.create(userId, request.name());
	}

	@GetMapping("/{listId}")
	ListDetail get(@CurrentUserId UUID userId, @PathVariable UUID listId) {
		return listService.get(listId, userId);
	}

	@PatchMapping("/{listId}")
	ListDetail rename(@CurrentUserId UUID userId, @PathVariable UUID listId,
			@Valid @RequestBody ListRequests.ListName request) {
		return listService.rename(listId, userId, request.name());
	}

	@DeleteMapping("/{listId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@CurrentUserId UUID userId, @PathVariable UUID listId) {
		listService.delete(listId, userId);
	}

	@PostMapping("/{listId}/invite-code")
	ListRequests.InviteCode regenerateInviteCode(@CurrentUserId UUID userId, @PathVariable UUID listId) {
		return new ListRequests.InviteCode(listService.regenerateInviteCode(listId, userId));
	}

	@PostMapping("/join")
	ListDetail join(@CurrentUserId UUID userId, @Valid @RequestBody ListRequests.Join request) {
		return listService.join(userId, request.code());
	}

	@DeleteMapping("/{listId}/members/{memberId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeMember(@CurrentUserId UUID userId, @PathVariable UUID listId, @PathVariable UUID memberId) {
		listService.removeMember(listId, userId, memberId);
	}

}
