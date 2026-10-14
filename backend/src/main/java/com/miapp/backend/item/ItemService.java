package com.miapp.backend.item;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miapp.backend.common.ApiException;
import com.miapp.backend.common.ListEvent;
import com.miapp.backend.list.ListAccessService;
import com.miapp.backend.list.ListMember;
import com.miapp.backend.product.CustomItemIcons;
import com.miapp.backend.product.Product;
import com.miapp.backend.product.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemService {

	// Collator ordena como un diccionario español: "ñ" va después de "n", las tildes no descolocan
	private static final Collator SPANISH = Collator.getInstance(Locale.forLanguageTag("es"));

	/** Orden del supermercado: por sección (los escritos a mano al final) y luego alfabético. */
	private static final Comparator<ItemDto> STORE_ORDER = Comparator
		.comparing(ItemDto::categoryOrder, Comparator.nullsLast(Comparator.naturalOrder()))
		.thenComparing(ItemDto::name, SPANISH);

	private final ListItemRepository items;
	private final ListAccessService access;
	private final ProductRepository products;
	private final CustomItemIcons customIcons;
	private final RecentItemRepository recentItems;
	private final ApplicationEventPublisher events;

	@Transactional(readOnly = true)
	public List<ItemDto> list(UUID listId, UUID userId) {
		access.requireMember(listId, userId);
		return items.findAllForList(listId).stream().map(item -> ItemDto.from(item, customIcons)).sorted(STORE_ORDER).toList();
	}

	/** Si ya hay uno igual pendiente de coger, suma la cantidad en vez de duplicarlo. */
	@Transactional
	public ItemDto add(UUID listId, UUID userId, ItemRequests.Add request) {
		ListMember me = access.requireMember(listId, userId);
		String customName = blankToNull(request.customName());
		if ((request.productId() == null) == (customName == null)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Elige un producto del catálogo o escribe un nombre");
		}
		int quantity = request.quantity() != null ? request.quantity() : 1;
		String note = blankToNull(request.note());

		Product product = null;
		Optional<ListItem> existing;
		if (request.productId() != null) {
			product = products.findById(request.productId())
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Ese producto no existe en el catálogo"));
			existing = items.findFirstByListIdAndProductIdAndCheckedFalse(listId, product.getId());
		}
		else {
			existing = items.findUncheckedCustom(listId, customName);
		}
		// Ya validado: queda en "utilizados recientemente" aunque luego se quite de la lista
		if (product != null) {
			recentItems.touchProduct(listId, product.getId());
		}
		else {
			recentItems.touchCustom(listId, customName);
		}

		if (existing.isPresent()) {
			ListItem item = existing.get();
			item.addQuantity(quantity);
			if (note != null) {
				item.setNote(note);
			}
			return saved(listId, item);
		}
		ListItem item = new ListItem(me.getList(), product, customName, (short) quantity, note, me.getUser());
		return saved(listId, items.saveAndFlush(item)); // flush: rellena createdAt antes de construir el DTO
	}

	/**
	 * Añade varios productos en UNA transacción: si uno falla (p. ej. un producto que no existe),
	 * no se añade ninguno. Cada uno se comporta como add() (suma cantidad si ya estaba pendiente).
	 */
	@Transactional
	public List<ItemDto> addAll(UUID listId, UUID userId, List<ItemRequests.Add> requests) {
		return requests.stream().map(request -> add(listId, userId, request)).toList();
	}

	/** Hasta 30 productos usados en la lista, lo más reciente primero. */
	@Transactional(readOnly = true)
	public List<RecentItemDto> recent(UUID listId, UUID userId) {
		access.requireMember(listId, userId);
		return recentItems.findRecent(listId, 30).stream().map(row -> {
			if (row.productId() != null) {
				return new RecentItemDto(row.productId(), null, row.productName(), row.icon(), row.categoryId(),
						row.categoryName(), row.categoryOrder(), row.lastUsedAt().toInstant());
			}
			var guess = customIcons.guess(row.customName()).orElse(null);
			return new RecentItemDto(null, row.customName(), row.customName(), guess != null ? guess.icon() : null,
					guess != null ? guess.categoryId() : null, guess != null ? guess.categoryName() : null,
					guess != null ? guess.categoryOrder() : null, row.lastUsedAt().toInstant());
		}).toList();
	}

	@Transactional
	public ItemDto update(UUID listId, UUID itemId, UUID userId, ItemRequests.Update request) {
		ListMember me = access.requireMember(listId, userId);
		ListItem item = findItem(listId, itemId);
		if (request.checked() != null) {
			if (request.checked()) {
				item.check(me.getUser());
			}
			else {
				item.uncheck();
			}
		}
		if (request.quantity() != null) {
			item.setQuantity(request.quantity().shortValue());
		}
		if (request.note() != null) {
			item.setNote(blankToNull(request.note()));
		}
		return saved(listId, item);
	}

	@Transactional
	public void remove(UUID listId, UUID itemId, UUID userId) {
		access.requireMember(listId, userId);
		items.delete(findItem(listId, itemId));
		events.publishEvent(ListEvent.of(listId, ListEvent.ITEMS_DELETED, Map.of("ids", List.of(itemId))));
	}

	/**
	 * "Vaciar el carro": borra los ya cogidos. Se avisa con los ids concretos borrados (no
	 * "borrad los marcados"): si alguien marcó otro justo después, ese sigue en la lista.
	 */
	@Transactional
	public void clearChecked(UUID listId, UUID userId) {
		access.requireMember(listId, userId);
		List<UUID> deleted = items.deleteCheckedReturningIds(listId);
		if (!deleted.isEmpty()) {
			events.publishEvent(ListEvent.of(listId, ListEvent.ITEMS_DELETED, Map.of("ids", deleted)));
		}
	}

	private ItemDto saved(UUID listId, ListItem item) {
		ItemDto dto = ItemDto.from(item, customIcons);
		events.publishEvent(ListEvent.of(listId, ListEvent.ITEM_SAVED, dto));
		return dto;
	}

	private ListItem findItem(UUID listId, UUID itemId) {
		return items.findByIdAndListId(itemId, listId)
			.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ese producto ya no está en la lista"));
	}

	private static String blankToNull(String text) {
		return text == null || text.isBlank() ? null : text.trim();
	}

}
