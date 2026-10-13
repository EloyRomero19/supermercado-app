-- pg_trgm: búsqueda por trigramas (trozos de 3 letras), tolera erratas y acelera LIKE '%...%'.
-- unaccent: quita tildes ("Plátano" → "Platano").
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Secciones del supermercado; sort_order sigue el recorrido típico de la tienda
CREATE TABLE category (
    id         smallint    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       varchar(60) NOT NULL UNIQUE,
    sort_order smallint    NOT NULL
);

-- search_name es el nombre normalizado (minúsculas y sin tildes) sobre el que se busca.
-- Se guarda ya calculado para poder indexarlo; el backend normaliza igual el texto buscado.
CREATE TABLE product (
    id          bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(120) NOT NULL UNIQUE,
    search_name varchar(120) NOT NULL,
    category_id smallint     NOT NULL REFERENCES category (id)
);

-- Índice GIN de trigramas: hace rápidas las búsquedas por similitud y por "contiene"
CREATE INDEX product_search_name_trgm_idx ON product USING gin (search_name gin_trgm_ops);

INSERT INTO category (name, sort_order) VALUES
    ('Frutas y verduras', 1),
    ('Carnicería', 2),
    ('Pescadería', 3),
    ('Charcutería y quesos', 4),
    ('Lácteos y huevos', 5),
    ('Panadería y bollería', 6),
    ('Despensa', 7),
    ('Desayuno y dulces', 8),
    ('Congelados', 9),
    ('Bebidas', 10),
    ('Limpieza', 11),
    ('Higiene y cuidado personal', 12),
    ('Bebé y mascotas', 13);

-- Semilla del catálogo: un INSERT por categoría a partir de un array de nombres
INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Frutas y verduras')
FROM unnest(ARRAY[
    'Manzana', 'Plátano', 'Naranja', 'Mandarina', 'Limón', 'Pera', 'Uvas', 'Fresas', 'Melón',
    'Sandía', 'Piña', 'Kiwi', 'Melocotón', 'Aguacate', 'Tomate', 'Lechuga', 'Cebolla', 'Ajo',
    'Patata', 'Zanahoria', 'Pimiento rojo', 'Pimiento verde', 'Calabacín', 'Berenjena', 'Pepino',
    'Brócoli', 'Coliflor', 'Espinacas', 'Champiñones', 'Puerro', 'Calabaza', 'Judías verdes', 'Perejil'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Carnicería')
FROM unnest(ARRAY[
    'Pechuga de pollo', 'Muslos de pollo', 'Pollo entero', 'Alitas de pollo', 'Carne picada',
    'Filetes de ternera', 'Lomo de cerdo', 'Solomillo de cerdo', 'Costillas de cerdo',
    'Chuletas de cordero', 'Hamburguesas', 'Salchichas', 'Pavo en filetes', 'Chorizo fresco'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Pescadería')
FROM unnest(ARRAY[
    'Salmón', 'Merluza', 'Bacalao', 'Atún fresco', 'Sardinas', 'Dorada', 'Lubina', 'Gambas',
    'Calamares', 'Mejillones', 'Boquerones', 'Pulpo'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Charcutería y quesos')
FROM unnest(ARRAY[
    'Jamón serrano', 'Jamón cocido', 'Pechuga de pavo', 'Chorizo', 'Salchichón', 'Fuet',
    'Lomo embuchado', 'Bacon', 'Queso curado', 'Queso semicurado', 'Queso fresco', 'Queso rallado',
    'Queso en lonchas', 'Mozzarella'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Lácteos y huevos')
FROM unnest(ARRAY[
    'Leche entera', 'Leche semidesnatada', 'Leche desnatada', 'Leche sin lactosa', 'Bebida de avena',
    'Bebida de soja', 'Yogur natural', 'Yogur griego', 'Yogures de sabores', 'Kéfir', 'Mantequilla',
    'Nata para cocinar', 'Nata para montar', 'Huevos', 'Natillas', 'Flan'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Panadería y bollería')
FROM unnest(ARRAY[
    'Pan de barra', 'Pan de molde', 'Pan integral', 'Pan rallado', 'Tostadas', 'Picos', 'Croissants',
    'Magdalenas', 'Bizcocho', 'Tortillas de trigo', 'Masa de pizza'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Despensa')
FROM unnest(ARRAY[
    'Arroz', 'Arroz integral', 'Espaguetis', 'Macarrones', 'Fideos', 'Pasta de lasaña', 'Cuscús',
    'Quinoa', 'Lentejas', 'Garbanzos', 'Alubias', 'Harina', 'Azúcar', 'Sal', 'Aceite de oliva',
    'Aceite de oliva virgen extra', 'Aceite de girasol', 'Vinagre', 'Tomate frito', 'Tomate triturado',
    'Atún en lata', 'Sardinas en lata', 'Mayonesa', 'Ketchup', 'Mostaza', 'Caldo de pollo',
    'Pimienta negra', 'Pimentón', 'Orégano', 'Comino', 'Levadura', 'Maíz dulce', 'Aceitunas',
    'Pepinillos', 'Espárragos en conserva', 'Patatas fritas', 'Frutos secos', 'Almendras', 'Nueces'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Desayuno y dulces')
FROM unnest(ARRAY[
    'Café molido', 'Café en cápsulas', 'Café soluble', 'Té', 'Infusión de manzanilla',
    'Cacao en polvo', 'Cereales', 'Copos de avena', 'Galletas', 'Mermelada', 'Miel', 'Chocolate',
    'Crema de cacao', 'Turrón'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Congelados')
FROM unnest(ARRAY[
    'Guisantes congelados', 'Verduras congeladas', 'Espinacas congeladas', 'Patatas fritas congeladas',
    'Pizza congelada', 'Lasaña congelada', 'Croquetas', 'San Jacobos', 'Varitas de merluza',
    'Gambas congeladas', 'Helado', 'Hielo'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Bebidas')
FROM unnest(ARRAY[
    'Agua', 'Agua con gas', 'Zumo de naranja', 'Zumo de piña', 'Refresco de cola', 'Refresco de limón',
    'Tónica', 'Bebida isotónica', 'Cerveza', 'Cerveza sin alcohol', 'Vino tinto', 'Vino blanco', 'Cava',
    'Gazpacho', 'Horchata'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Limpieza')
FROM unnest(ARRAY[
    'Detergente', 'Suavizante', 'Lavavajillas', 'Pastillas lavavajillas', 'Lejía',
    'Limpiador multiusos', 'Friegasuelos', 'Limpiacristales', 'Quitagrasas', 'Ambientador',
    'Papel de cocina', 'Papel de aluminio', 'Film transparente', 'Bolsas de basura', 'Estropajos',
    'Bayetas'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Higiene y cuidado personal')
FROM unnest(ARRAY[
    'Papel higiénico', 'Pañuelos de papel', 'Champú', 'Gel de ducha', 'Jabón de manos',
    'Pasta de dientes', 'Cepillo de dientes', 'Enjuague bucal', 'Desodorante', 'Crema hidratante',
    'Protector solar', 'Maquinillas de afeitar', 'Compresas', 'Tampones', 'Bastoncillos', 'Algodón'
]) AS name;

INSERT INTO product (name, search_name, category_id)
SELECT name, lower(unaccent(name)), (SELECT id FROM category WHERE name = 'Bebé y mascotas')
FROM unnest(ARRAY[
    'Pañales', 'Toallitas', 'Leche infantil', 'Potitos', 'Comida para perro', 'Snacks para perro',
    'Comida para gato', 'Arena para gato'
]) AS name;
