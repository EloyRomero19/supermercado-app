-- "Utilizados recientemente": lo que se ha añadido alguna vez a cada lista, aunque ya se haya
-- quitado. Una fila por producto (o por texto libre) y lista, con la fecha del último uso.
CREATE TABLE list_recent_item (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id      uuid         NOT NULL REFERENCES shopping_list (id) ON DELETE CASCADE,
    product_id   bigint       REFERENCES product (id) ON DELETE CASCADE,
    custom_name  varchar(120),
    last_used_at timestamptz  NOT NULL DEFAULT now(),
    times_used   integer      NOT NULL DEFAULT 1,
    CONSTRAINT list_recent_item_product_xor_custom CHECK ((product_id IS NULL) <> (custom_name IS NULL))
);

-- Sin duplicados: un producto del catálogo una sola vez por lista, y un texto libre una sola vez
-- sin distinguir mayúsculas. Son índices parciales (WHERE): cada uno vigila solo su tipo de fila.
CREATE UNIQUE INDEX list_recent_item_product_uk ON list_recent_item (list_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX list_recent_item_custom_uk ON list_recent_item (list_id, lower(custom_name)) WHERE custom_name IS NOT NULL;
CREATE INDEX list_recent_item_list_idx ON list_recent_item (list_id, last_used_at DESC);

-- Rellenar con lo que ya hay en las listas para no empezar vacíos.
-- DISTINCT ON se queda con una fila por grupo: la primera según el ORDER BY (la más reciente).
INSERT INTO list_recent_item (list_id, product_id, custom_name, last_used_at)
SELECT DISTINCT ON (list_id, product_id, lower(custom_name)) list_id, product_id, custom_name, created_at
FROM list_item
ORDER BY list_id, product_id, lower(custom_name), created_at DESC;
