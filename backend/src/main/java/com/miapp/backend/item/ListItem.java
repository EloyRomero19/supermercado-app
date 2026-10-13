package com.miapp.backend.item;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.miapp.backend.list.ShoppingList;
import com.miapp.backend.product.Product;
import com.miapp.backend.user.AppUser;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ListItem {

	static final int MAX_QUANTITY = 999;

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	private ShoppingList list;

	@ManyToOne(fetch = FetchType.LAZY)
	private Product product;

	private String customName;

	@Setter
	private short quantity;

	@Setter
	private String note;

	private boolean checked;

	// Por convención JPA buscaría "checked_by_id"; la columna se llama "checked_by"
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "checked_by")
	private AppUser checkedBy;

	private Instant checkedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "added_by")
	private AppUser addedBy;

	@CreationTimestamp
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	/**
	 * Bloqueo optimista. Hibernate hace "UPDATE ... SET version = 6 WHERE id = ? AND version = 5".
	 * Si otra transacción lo cambió entre medias, la versión ya no es 5, el UPDATE no toca ninguna
	 * fila y Hibernate lanza una excepción en vez de pisar el cambio del otro (que devolvemos como 409).
	 */
	@Version
	private int version;

	ListItem(ShoppingList list, Product product, String customName, short quantity, String note, AppUser addedBy) {
		this.list = list;
		this.product = product;
		this.customName = customName;
		this.quantity = quantity;
		this.note = note;
		this.addedBy = addedBy;
	}

	/** Idempotente: marcar dos veces conserva quién y cuándo lo marcó primero. */
	void check(AppUser by) {
		if (!checked) {
			checked = true;
			checkedBy = by;
			checkedAt = Instant.now();
		}
	}

	void uncheck() {
		checked = false;
		checkedBy = null;
		checkedAt = null;
	}

	/** Al volver a añadir algo que ya está pendiente, se suman las cantidades (con tope). */
	void addQuantity(int amount) {
		quantity = (short) Math.min(MAX_QUANTITY, quantity + amount);
	}

	String displayName() {
		return product != null ? product.getName() : customName;
	}

}
