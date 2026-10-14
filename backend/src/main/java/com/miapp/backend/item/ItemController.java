package com.miapp.backend.item;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.miapp.backend.auth.CurrentUserId;
import com.miapp.backend.common.ApiException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lists/{listId}/items")
@RequiredArgsConstructor
class ItemController {

	private final ItemService itemService;

	@GetMapping
	List<ItemDto> list(@CurrentUserId UUID userId, @PathVariable UUID listId) {
		return itemService.list(listId, userId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	ItemDto add(@CurrentUserId UUID userId, @PathVariable UUID listId, @Valid @RequestBody ItemRequests.Add request) {
		return itemService.add(listId, userId, request);
	}

	@PostMapping("/bulk")
	@ResponseStatus(HttpStatus.CREATED)
	List<ItemDto> addAll(@CurrentUserId UUID userId, @PathVariable UUID listId,
			@Valid @RequestBody ItemRequests.AddMany request) {
		return itemService.addAll(listId, userId, request.items());
	}

	@PatchMapping("/{itemId}")
	ItemDto update(@CurrentUserId UUID userId, @PathVariable UUID listId, @PathVariable UUID itemId,
			@Valid @RequestBody ItemRequests.Update request) {
		return itemService.update(listId, itemId, userId, request);
	}

	@DeleteMapping("/{itemId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void remove(@CurrentUserId UUID userId, @PathVariable UUID listId, @PathVariable UUID itemId) {
		itemService.remove(listId, itemId, userId);
	}

	/** DELETE /items?checked=true. Exigir el parámetro evita vaciar la lista entera por error. */
	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void clearChecked(@CurrentUserId UUID userId, @PathVariable UUID listId, @RequestParam boolean checked) {
		if (!checked) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Solo se pueden borrar en bloque los productos ya cogidos");
		}
		itemService.clearChecked(listId, userId);
	}

}
