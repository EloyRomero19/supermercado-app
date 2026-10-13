-- Productos de cada lista: o del catálogo (product_id) o escritos a mano (custom_name), nunca ambos.
CREATE TABLE list_item (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id     uuid         NOT NULL REFERENCES shopping_list (id) ON DELETE CASCADE,
    product_id  bigint       REFERENCES product (id),
    custom_name varchar(120),
    quantity    smallint     NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 999),
    note        varchar(200),
    checked     boolean      NOT NULL DEFAULT false,
    -- SET NULL: si se borra un usuario, sus productos siguen en la lista
    checked_by  uuid         REFERENCES app_user (id) ON DELETE SET NULL,
    checked_at  timestamptz,
    added_by    uuid         REFERENCES app_user (id) ON DELETE SET NULL,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    -- Bloqueo optimista: cada UPDATE lo incrementa (ver ListItem.version)
    version     integer      NOT NULL DEFAULT 0,
    -- "<>" entre dos booleanos es un XOR: exactamente uno de los dos debe estar relleno
    CONSTRAINT list_item_product_xor_custom CHECK ((product_id IS NULL) <> (custom_name IS NULL))
);

CREATE INDEX list_item_list_idx ON list_item (list_id);
