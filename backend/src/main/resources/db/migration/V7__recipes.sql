-- Recetas: platos típicos con sus ingredientes, que son productos del catálogo.
-- Si un ingrediente no existiera en el catálogo, el subselect daría NULL y la migración fallaría
-- (product_id es NOT NULL): así no puede quedar una receta con un ingrediente roto.
CREATE TABLE recipe (
    id          smallint     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(100) NOT NULL UNIQUE,
    emoji       varchar(16)  NOT NULL,
    description varchar(300) NOT NULL,
    minutes     smallint     NOT NULL CHECK (minutes > 0),
    servings    smallint     NOT NULL CHECK (servings > 0),
    difficulty  varchar(10)  NOT NULL CHECK (difficulty IN ('Fácil', 'Media', 'Difícil')),
    steps       text         NOT NULL, -- un paso por línea
    sort_order  smallint     NOT NULL
);

CREATE TABLE recipe_ingredient (
    recipe_id  smallint    NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
    product_id bigint      NOT NULL REFERENCES product (id),
    amount     varchar(40) NOT NULL, -- "1 kg", "2 dientes", "al gusto"…
    position   smallint    NOT NULL,
    PRIMARY KEY (recipe_id, product_id)
);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Tortilla de patatas', '🥔', 'La de toda la vida: jugosa por dentro y dorada por fuera.', 35, 4, 'Fácil',
            'Pela y corta las patatas y la cebolla en láminas finas.' || E'\n' || 'Fríelas a fuego medio en abundante aceite hasta que estén tiernas, unos 20 minutos.' || E'\n' || 'Escúrrelas y mézclalas con los huevos batidos y una pizca de sal.' || E'\n' || 'Cuaja la mezcla en una sartén con un poco de aceite, dale la vuelta con un plato y termina por el otro lado.', 1)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Patata', '1 kg', 1),
        ('Huevos', '6', 2),
        ('Cebolla', '1', 3),
        ('Aceite de oliva virgen extra', '250 ml', 4),
        ('Sal', 'al gusto', 5)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Paella mixta', '🥘', 'Arroz con pollo y marisco para compartir el domingo.', 60, 4, 'Media',
            'Dora el pollo troceado en la paellera con el aceite y reserva las gambas ya marcadas.' || E'\n' || 'Sofríe el pimiento, las judías, el ajo y los calamares; añade el tomate y el pimentón.' || E'\n' || 'Incorpora el arroz, remueve un minuto y vierte el caldo caliente.' || E'\n' || 'Cuece 18 minutos sin remover, coloca las gambas encima y deja reposar 5 minutos tapada.', 2)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Arroz', '400 g', 1),
        ('Pechuga de pollo', '300 g', 2),
        ('Gambas', '200 g', 3),
        ('Calamares', '200 g', 4),
        ('Pimiento rojo', '1', 5),
        ('Judías verdes', '150 g', 6),
        ('Tomate triturado', '200 g', 7),
        ('Caldo de pollo', '1 l', 8),
        ('Ajo', '2 dientes', 9),
        ('Pimentón', '1 cucharadita', 10),
        ('Aceite de oliva virgen extra', '4 cucharadas', 11)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Espaguetis a la boloñesa', '🍝', 'Pasta con salsa de carne y tomate, un clásico que gusta a todos.', 35, 4, 'Fácil',
            'Pica la cebolla, la zanahoria y el ajo y sofríelos en el aceite.' || E'\n' || 'Añade la carne picada y cocínala hasta que pierda el color rosado.' || E'\n' || 'Incorpora el tomate y deja reducir la salsa 20 minutos a fuego lento.' || E'\n' || 'Cuece la pasta, mézclala con la salsa y sirve con queso rallado por encima.', 3)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Espaguetis', '400 g', 1),
        ('Carne picada', '500 g', 2),
        ('Tomate triturado', '400 g', 3),
        ('Cebolla', '1', 4),
        ('Zanahoria', '1', 5),
        ('Ajo', '2 dientes', 6),
        ('Queso rallado', 'al gusto', 7),
        ('Aceite de oliva', '2 cucharadas', 8)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Gazpacho andaluz', '🍅', 'Sopa fría de verano, fresca y sin cocinar.', 15, 4, 'Fácil',
            'Trocea los tomates, el pepino pelado, el pimiento y el ajo.' || E'\n' || 'Tritura todo con el pan remojado, el vinagre y la sal.' || E'\n' || 'Añade el aceite poco a poco sin dejar de batir hasta que emulsione.' || E'\n' || 'Cuela si lo quieres muy fino y enfríalo al menos una hora antes de servir.', 4)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Tomate', '1 kg', 1),
        ('Pepino', '1', 2),
        ('Pimiento verde', '1', 3),
        ('Ajo', '1 diente', 4),
        ('Pan de barra', '50 g', 5),
        ('Aceite de oliva virgen extra', '100 ml', 6),
        ('Vinagre', '2 cucharadas', 7),
        ('Sal', 'al gusto', 8)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Lentejas estofadas', '🍲', 'Plato de cuchara reconfortante, perfecto para el invierno.', 50, 4, 'Fácil',
            'Sofríe la cebolla, el pimiento, el ajo y la zanahoria picados.' || E'\n' || 'Añade el pimentón, el chorizo en rodajas y las lentejas lavadas.' || E'\n' || 'Cubre con agua y cuece 30 minutos a fuego suave.' || E'\n' || 'Agrega la patata en trozos y cuece 15 minutos más, hasta que esté tierna.', 5)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Lentejas', '400 g', 1),
        ('Chorizo', '1', 2),
        ('Patata', '2', 3),
        ('Zanahoria', '2', 4),
        ('Cebolla', '1', 5),
        ('Pimiento verde', '1', 6),
        ('Ajo', '2 dientes', 7),
        ('Pimentón', '1 cucharadita', 8),
        ('Aceite de oliva', '2 cucharadas', 9)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Pollo al horno con patatas', '🍗', 'Pollo jugoso con patatas panaderas, todo en la misma bandeja.', 70, 4, 'Fácil',
            'Precalienta el horno a 200 °C.' || E'\n' || 'Corta las patatas y la cebolla en rodajas y colócalas en la bandeja con sal y aceite.' || E'\n' || 'Pon el pollo encima con el limón, los ajos y el orégano.' || E'\n' || 'Hornea unos 60 minutos, regándolo con su jugo a mitad de cocción.', 6)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Pollo entero', '1', 1),
        ('Patata', '4', 2),
        ('Cebolla', '2', 3),
        ('Limón', '1', 4),
        ('Ajo', '1 cabeza', 5),
        ('Orégano', '1 cucharadita', 6),
        ('Aceite de oliva', '4 cucharadas', 7),
        ('Sal', 'al gusto', 8)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Salmón al horno con verduras', '🐟', 'Cena ligera y sana lista en menos de media hora.', 25, 2, 'Fácil',
            'Precalienta el horno a 200 °C.' || E'\n' || 'Corta las verduras en tiras y hornéalas 10 minutos con aceite y sal.' || E'\n' || 'Coloca el salmón encima con unas rodajas de limón.' || E'\n' || 'Hornea 12 minutos más, hasta que el salmón se separe en láminas.', 7)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Salmón', '2 lomos', 1),
        ('Calabacín', '1', 2),
        ('Pimiento rojo', '1', 3),
        ('Cebolla', '1', 4),
        ('Limón', '1', 5),
        ('Aceite de oliva virgen extra', '3 cucharadas', 6)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Macarrones con chorizo', '🧀', 'Gratinados, con tomate y chorizo: éxito asegurado con los peques.', 30, 4, 'Fácil',
            'Cuece los macarrones y escúrrelos.' || E'\n' || 'Sofríe la cebolla picada con el chorizo troceado.' || E'\n' || 'Mezcla la pasta con el sofrito y el tomate frito.' || E'\n' || 'Cubre con queso rallado y orégano y gratina 10 minutos.', 8)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Macarrones', '400 g', 1),
        ('Chorizo', '150 g', 2),
        ('Tomate frito', '400 g', 3),
        ('Cebolla', '1', 4),
        ('Queso rallado', '100 g', 5),
        ('Orégano', '1 pizca', 6)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Tacos de carne', '🌮', 'Cena divertida para montar en la mesa al gusto de cada uno.', 25, 4, 'Fácil',
            'Sofríe la cebolla picada y añade la carne con el comino y sal.' || E'\n' || 'Pica el tomate y la lechuga y machaca el aguacate con un poco de sal.' || E'\n' || 'Calienta las tortillas en una sartén sin aceite.' || E'\n' || 'Rellena cada tortilla con carne, verduras, aguacate y queso.', 9)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Tortillas de trigo', '8', 1),
        ('Carne picada', '500 g', 2),
        ('Cebolla', '1', 3),
        ('Tomate', '2', 4),
        ('Lechuga', '1', 5),
        ('Aguacate', '2', 6),
        ('Queso rallado', '100 g', 7),
        ('Comino', '1 cucharadita', 8)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Pizza casera', '🍕', 'Más rica que la de la tienda y lista en media hora.', 30, 2, 'Fácil',
            'Precalienta el horno a 220 °C.' || E'\n' || 'Extiende la masa y cúbrela con el tomate frito.' || E'\n' || 'Reparte la mozzarella, el jamón, los champiñones laminados y las aceitunas.' || E'\n' || 'Espolvorea orégano y hornea 12-15 minutos, hasta que el borde esté dorado.', 10)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Masa de pizza', '1', 1),
        ('Tomate frito', '150 g', 2),
        ('Mozzarella', '200 g', 3),
        ('Jamón cocido', '100 g', 4),
        ('Champiñones', '150 g', 5),
        ('Aceitunas', 'al gusto', 6),
        ('Orégano', '1 pizca', 7)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Crema de calabacín', '🥣', 'Suave y cremosa, ideal como primer plato o cena ligera.', 30, 4, 'Fácil',
            'Pocha la cebolla en el aceite.' || E'\n' || 'Añade el calabacín y la patata en trozos y rehoga 5 minutos.' || E'\n' || 'Cubre con el caldo y cuece 15 minutos.' || E'\n' || 'Tritura con la nata hasta que quede fina y ajusta de sal.', 11)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Calabacín', '3', 1),
        ('Patata', '1', 2),
        ('Cebolla', '1', 3),
        ('Nata para cocinar', '100 ml', 4),
        ('Caldo de pollo', '500 ml', 5),
        ('Aceite de oliva', '2 cucharadas', 6),
        ('Sal', 'al gusto', 7)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Tortitas americanas', '🥞', 'Desayuno de fin de semana, esponjosas y con miel.', 20, 4, 'Fácil',
            'Mezcla la harina, el azúcar y la levadura.' || E'\n' || 'Añade la leche, los huevos y la mantequilla derretida y bate hasta que no haya grumos.' || E'\n' || 'Vierte un cucharón en una sartén caliente y untada con mantequilla.' || E'\n' || 'Dales la vuelta cuando salgan burbujas y sírvelas con miel.', 12)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Harina', '200 g', 1),
        ('Leche entera', '300 ml', 2),
        ('Huevos', '2', 3),
        ('Mantequilla', '30 g', 4),
        ('Azúcar', '2 cucharadas', 5),
        ('Levadura', '1 sobre', 6),
        ('Miel', 'al gusto', 7)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Arroz con leche', '🍮', 'El postre de la abuela, cremoso y con aroma a limón.', 50, 6, 'Fácil',
            'Calienta la leche con la piel del limón.' || E'\n' || 'Cuando hierva, añade el arroz y cuece a fuego muy suave 40 minutos, removiendo a menudo.' || E'\n' || 'Agrega el azúcar y cuece 5 minutos más.' || E'\n' || 'Retira la piel de limón y deja enfriar antes de servir.', 13)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Arroz', '150 g', 1),
        ('Leche entera', '1 l', 2),
        ('Azúcar', '150 g', 3),
        ('Limón', 'la piel de 1', 4)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Ensalada completa', '🥗', 'Fresca, rápida y con todo lo necesario para una comida ligera.', 10, 2, 'Fácil',
            'Cuece los huevos 10 minutos y pélalos.' || E'\n' || 'Lava y trocea la lechuga, el tomate y la cebolla.' || E'\n' || 'Añade el atún, el maíz, las aceitunas y los huevos en cuartos.' || E'\n' || 'Aliña con aceite, vinagre y sal justo antes de servir.', 14)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Lechuga', '1', 1),
        ('Tomate', '2', 2),
        ('Cebolla', '½', 3),
        ('Atún en lata', '2 latas', 4),
        ('Huevos', '2', 5),
        ('Aceitunas', 'al gusto', 6),
        ('Maíz dulce', '1 lata pequeña', 7),
        ('Aceite de oliva virgen extra', '3 cucharadas', 8),
        ('Vinagre', '1 cucharada', 9)
    ) AS i(name, amount, position);

WITH r AS (
    INSERT INTO recipe (name, emoji, description, minutes, servings, difficulty, steps, sort_order)
    VALUES ('Hummus de garbanzos', '🧆', 'Para untar con pan o verduras; listo en 10 minutos.', 10, 4, 'Fácil',
            'Escurre y enjuaga los garbanzos cocidos.' || E'\n' || 'Tritúralos con el ajo, el zumo de limón, el comino y un poco de agua.' || E'\n' || 'Añade el aceite poco a poco hasta lograr una crema fina.' || E'\n' || 'Sirve con un chorrito de aceite y una pizca de pimentón por encima.', 15)
    RETURNING id
)
INSERT INTO recipe_ingredient (recipe_id, product_id, amount, position)
SELECT r.id, (SELECT id FROM product WHERE name = i.name), i.amount, i.position
FROM r, (VALUES
        ('Garbanzos', '400 g', 1),
        ('Ajo', '1 diente', 2),
        ('Limón', '1', 3),
        ('Aceite de oliva virgen extra', '4 cucharadas', 4),
        ('Comino', '½ cucharadita', 5),
        ('Pimentón', '1 pizca', 6)
    ) AS i(name, amount, position);
