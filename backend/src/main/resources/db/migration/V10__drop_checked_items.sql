-- Sin carrito: un producto de la lista ya no se "marca como cogido". Al tocarlo se borra, y la
-- lista es solo lo que falta. Esto quita el estado "cogido" del esquema.

-- Lo que estaba marcado ya se compró (era el carrito sin vaciar con "Terminar la compra"): se
-- borra. Sigue en "Otras veces" porque list_recent_item es otra tabla y no depende de list_item.
DELETE FROM list_item WHERE checked;

-- Al borrar checked_by desaparece también su FK hacia app_user (ON DELETE SET NULL).
ALTER TABLE list_item
    DROP COLUMN checked,
    DROP COLUMN checked_by,
    DROP COLUMN checked_at;
