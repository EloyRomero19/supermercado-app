/**
 * Qué dibujo (public/dibujos/<clave>.svg) le toca a cada producto. Los dibujos los genera
 * scripts/dibujos/generar.py; aquí solo se decide cuál usar.
 *
 * Se busca por PALABRAS del nombre, así sirve también para lo escrito a mano ("tomates",
 * "barra de pan", "leche sin lactosa"): cada regla es una frase que tiene que aparecer entera y en
 * orden. Las reglas van de la más concreta a la más general ("tomate frito" antes que "tomate").
 * Si ninguna encaja, el dibujo de su sección; si tampoco hay sección, una bolsa de la compra.
 */

/** Minúsculas, sin tildes ni signos (como ProductService.normalize del backend). Sirve para comparar nombres. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Plural → singular, lo justo para comparar: "tomates" → "tomate", "limones" → "limon",
 * "pañales" → "panal". En español, las palabras acabadas en consonante hacen el plural con "-es"
 * y las acabadas en vocal con "-s".
 */
function singular(word: string): string {
  if (word.length > 4 && /[lnrdjzc]es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

function words(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean).map(singular)
}

/** [frase, dibujo]. El orden importa: gana la primera que encaje. */
const RULES: [string, string][] = [
  // Lo que contiene el nombre de otro producto va primero
  ['patatas fritas congeladas', 'fritas'],
  ['patatas fritas', 'patatas-fritas'],
  ['tomate frito', 'tomate-frito'],
  ['tomate triturado', 'tomate-lata'],
  ['zumo de piña', 'zumo-pina'],
  ['zumo', 'zumo-naranja'],
  ['refresco de limón', 'refresco-limon'],
  ['refresco', 'cola'],
  ['cola', 'cola'],
  ['leche infantil', 'biberon'],
  ['bebida de soja', 'bebida-soja'],
  ['bebida de avena', 'bebida-vegetal'],
  ['bebida vegetal', 'bebida-vegetal'],
  ['bebida isotónica', 'isotonica'],
  ['isotónica', 'isotonica'],
  ['agua con gas', 'agua-gas'],
  ['cerveza sin alcohol', 'cerveza-sin'],
  ['vino blanco', 'vino-blanco'],
  ['vino', 'vino-tinto'],
  ['aceite de girasol', 'aceite-girasol'],
  ['aceite', 'aceite'],
  ['atún en lata', 'lata-atun'],
  ['sardinas en lata', 'lata-sardinas'],
  ['espinacas congeladas', 'congelado'],
  ['verduras congeladas', 'congelado'],
  ['gambas congeladas', 'gamba'],
  ['varitas', 'varitas'],
  ['caldo', 'caldo'],
  ['crema de cacao', 'crema-cacao'],
  ['crema hidratante', 'crema'],
  ['pasta de dientes', 'pasta-dientes'],
  ['dentífrico', 'pasta-dientes'],
  ['cepillo de dientes', 'cepillo'],
  ['pasta de lasaña', 'lasana'],
  ['lasaña congelada', 'lasana-bandeja'],
  ['lasaña', 'lasana'],
  ['masa de pizza', 'tortilla-trigo'],
  ['pizza', 'pizza'],
  ['pan rallado', 'harina'],
  ['pan de molde', 'pan-molde'],
  ['pan integral', 'pan-molde'],
  ['tortillas de trigo', 'tortilla-trigo'],
  ['copos de avena', 'cuscus'],
  ['pechuga de pavo', 'lonchas-pavo'],
  ['caldo de pollo', 'caldo'],
  ['comida para gato', 'comida-gato'],
  ['comida para perro', 'comida-perro'],
  ['snacks para perro', 'hueso'],
  ['arena para gato', 'arena'],
  ['papel de aluminio', 'aluminio'],
  ['papel de cocina', 'papel-cocina'],
  ['papel higiénico', 'papel-higienico'],
  ['pañuelos', 'panuelos'],
  ['bolsas de basura', 'bolsas-basura'],
  ['pastillas lavavajillas', 'pastillas'],
  ['protector solar', 'protector-solar'],
  ['café en cápsulas', 'capsulas'],
  ['cápsulas', 'capsulas'],
  ['café soluble', 'cafe-soluble'],
  ['infusión', 'manzanilla'],
  ['manzanilla', 'manzanilla'],
  ['frutos secos', 'frutos-secos'],
  ['queso en lonchas', 'lonchas-queso'],
  ['queso fresco', 'queso-fresco'],
  ['jamón cocido', 'lonchas'],
  ['jamón york', 'lonchas'],
  ['chorizo fresco', 'salchichas'],
  ['lomo embuchado', 'lomo-embuchado'],
  ['pimiento verde', 'pimiento-verde'],
  ['yogures de sabores', 'yogur-fresa'],
  ['yogur de fresa', 'yogur-fresa'],
  ['san jacobos', 'empanado'],
  ['nata', 'nata'],
  ['leche', 'leche'],
  // Frutas y verduras
  ['tomate', 'tomate'],
  ['manzana', 'manzana'],
  ['plátano', 'platano'],
  ['banana', 'platano'],
  ['naranja', 'naranja'],
  ['mandarina', 'mandarina'],
  ['limón', 'limon'],
  ['melocotón', 'melocoton'],
  ['pera', 'pera'],
  ['fresa', 'fresa'],
  ['uvas', 'uvas'],
  ['piña', 'pina'],
  ['sandía', 'sandia'],
  ['melón', 'melon'],
  ['kiwi', 'kiwi'],
  ['aguacate', 'aguacate'],
  ['zanahoria', 'zanahoria'],
  ['patata', 'patata'],
  ['cebolla', 'cebolla'],
  ['ajo', 'ajo'],
  ['lechuga', 'lechuga'],
  ['espinacas', 'hojas'],
  ['acelgas', 'hojas'],
  ['perejil', 'hierbas'],
  ['cilantro', 'hierbas'],
  ['albahaca', 'hierbas'],
  ['brócoli', 'brocoli'],
  ['coliflor', 'coliflor'],
  ['pepinillos', 'pepinillos'],
  ['pepino', 'pepino'],
  ['calabacín', 'calabacin'],
  ['berenjena', 'berenjena'],
  ['calabaza', 'calabaza'],
  ['champiñones', 'champinon'],
  ['setas', 'champinon'],
  ['judías', 'judias'],
  ['puerro', 'puerro'],
  ['guisantes', 'guisantes'],
  ['pimiento', 'pimiento-rojo'],
  // Carne, pescado y charcutería
  ['pechuga', 'pechuga'],
  ['pavo', 'pechuga'],
  ['alitas', 'muslo'],
  ['muslos', 'muslo'],
  ['pollo', 'pollo'],
  ['carne picada', 'carne-picada'],
  ['chorizo', 'chorizo'],
  ['fuet', 'fuet'],
  ['salchichón', 'fuet'],
  ['salchichas', 'salchichas'],
  ['lomo', 'filete'],
  ['solomillo', 'filete'],
  ['filetes', 'filete'],
  ['ternera', 'filete'],
  ['chuletas', 'chuleta'],
  ['costillas', 'costillas'],
  ['hamburguesas', 'hamburguesa'],
  ['jamón', 'jamon'],
  ['bacon', 'bacon'],
  ['beicon', 'bacon'],
  ['mozzarella', 'mozzarella'],
  ['queso', 'queso'],
  ['salmón', 'salmon'],
  ['atún', 'pescado-azul'],
  ['sardinas', 'pescado-azul'],
  ['boquerones', 'pescado-azul'],
  ['bacalao', 'pescado'],
  ['merluza', 'pescado'],
  ['dorada', 'pescado'],
  ['lubina', 'pescado'],
  ['pescado', 'pescado'],
  ['gambas', 'gamba'],
  ['langostinos', 'gamba'],
  ['calamares', 'pulpo'],
  ['pulpo', 'pulpo'],
  ['sepia', 'pulpo'],
  ['mejillones', 'mejillon'],
  ['almejas', 'mejillon'],
  ['croquetas', 'croquetas'],
  ['helado', 'helado'],
  ['hielo', 'hielo'],
  // Lácteos y huevos
  ['huevos', 'huevos'],
  ['yogur', 'yogur'],
  ['kéfir', 'kefir'],
  ['natillas', 'natillas'],
  ['flan', 'flan'],
  ['mantequilla', 'mantequilla'],
  // Panadería
  ['croissants', 'croissant'],
  ['cruasán', 'croissant'],
  ['magdalenas', 'magdalena'],
  ['bizcocho', 'bizcocho'],
  ['tostadas', 'tostadas'],
  ['picos', 'picos'],
  ['pan', 'baguette'],
  // Despensa y desayuno
  ['aceitunas', 'aceitunas'],
  ['almendras', 'almendras'],
  ['nueces', 'nueces'],
  ['nuez', 'nueces'],
  ['alubias', 'legumbres'],
  ['garbanzos', 'garbanzos'],
  ['lentejas', 'lentejas'],
  ['arroz', 'arroz'],
  ['azúcar', 'azucar'],
  ['comino', 'especias-marron'],
  ['canela', 'especias-marron'],
  ['orégano', 'especias-verde'],
  ['pimentón', 'especias-rojo'],
  ['pimienta', 'especias-negro'],
  ['cuscús', 'cuscus'],
  ['quinoa', 'cuscus'],
  ['espaguetis', 'espaguetis'],
  ['fideos', 'espaguetis'],
  ['macarrones', 'macarrones'],
  ['pasta', 'macarrones'],
  ['espárragos', 'esparragos'],
  ['harina', 'harina'],
  ['ketchup', 'ketchup'],
  ['kétchup', 'ketchup'],
  ['levadura', 'levadura'],
  ['mayonesa', 'mayonesa'],
  ['maíz', 'maiz'],
  ['mostaza', 'mostaza'],
  ['sal', 'sal'],
  ['vinagre', 'vinagre'],
  ['mermelada', 'mermelada'],
  ['miel', 'miel'],
  ['turrón', 'turron'],
  ['té', 'te'],
  ['café', 'cafe'],
  ['cacao', 'cacao'],
  ['cereales', 'cereales'],
  ['chocolate', 'chocolate'],
  ['galletas', 'galletas'],
  // Bebidas
  ['agua', 'agua'],
  ['cava', 'cava'],
  ['champán', 'cava'],
  ['cerveza', 'cerveza'],
  ['gazpacho', 'gazpacho'],
  ['horchata', 'horchata'],
  ['tónica', 'tonica'],
  // Limpieza
  ['ambientador', 'ambientador'],
  ['bayetas', 'bayeta'],
  ['basura', 'bolsas-basura'],
  ['detergente', 'detergente'],
  ['estropajos', 'estropajo'],
  ['esponja', 'estropajo'],
  ['film', 'film'],
  ['friegasuelos', 'friegasuelos'],
  ['lavavajillas', 'lavavajillas'],
  ['lejía', 'lejia'],
  ['limpiacristales', 'limpiacristales'],
  ['limpiador', 'multiusos'],
  ['quitagrasas', 'quitagrasas'],
  ['suavizante', 'suavizante'],
  ['aluminio', 'aluminio'],
  // Higiene
  ['algodón', 'algodon'],
  ['bastoncillos', 'bastoncillos'],
  ['cepillo', 'cepillo'],
  ['champú', 'champu'],
  ['compresas', 'caja-higiene'],
  ['tampones', 'caja-higiene'],
  ['desodorante', 'desodorante'],
  ['enjuague', 'enjuague'],
  ['gel', 'gel'],
  ['jabón', 'jabon'],
  ['maquinillas', 'maquinilla'],
  ['cuchillas', 'maquinilla'],
  ['crema', 'crema'],
  // Bebé y mascotas
  ['pañales', 'panal'],
  ['potitos', 'potito'],
  ['toallitas', 'toallitas'],
  ['biberón', 'biberon'],
  ['arena', 'arena'],
  ['gato', 'comida-gato'],
  ['perro', 'comida-perro'],
]

// Las frases se preparan una vez (en palabras, ya en singular)
const PREPARED = RULES.map(([phrase, drawing]) => [words(phrase), drawing] as const)

/** Dibujo de cada sección: para lo que no se reconoce y para las fichas de "Secciones". */
const CATEGORY_DRAWING: Record<string, string> = {
  'Frutas y verduras': 'manzana',
  Carnicería: 'filete',
  Pescadería: 'pescado',
  'Charcutería y quesos': 'queso',
  'Lácteos y huevos': 'leche',
  'Panadería y bollería': 'baguette',
  Despensa: 'aceite',
  'Desayuno y dulces': 'galletas',
  Congelados: 'helado',
  Bebidas: 'agua',
  Limpieza: 'detergente',
  'Higiene y cuidado personal': 'champu',
  'Bebé y mascotas': 'panal',
}

const FALLBACK_DRAWING = 'bolsa'

function contains(haystack: string[], needle: readonly string[]): boolean {
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((word, j) => haystack[i + j] === word)) return true
  }
  return false
}

/** Clave del dibujo que mejor representa el producto, o null si no se reconoce. */
export function matchDrawing(name: string): string | null {
  const nameWords = words(name)
  return PREPARED.find(([phrase]) => contains(nameWords, phrase))?.[1] ?? null
}

function categoryDrawing(categoryName: string | null): string {
  return (categoryName && CATEGORY_DRAWING[categoryName]) || FALLBACK_DRAWING
}

const drawingUrl = (key: string) => `/dibujos/${key}.svg`

/** URL del dibujo de un producto: el suyo, el de su sección o la bolsa de la compra. */
export function productDrawing(name: string, categoryName: string | null): string {
  return drawingUrl(matchDrawing(name) ?? categoryDrawing(categoryName))
}

/** Las recetas se ilustran con sus ingredientes principales (de dos a tres dibujos). */
const RECIPE_DRAWINGS: Record<string, string[]> = {
  'Tortilla de patatas': ['patata', 'huevos', 'cebolla'],
  'Paella mixta': ['arroz', 'gamba', 'pimiento-rojo'],
  'Espaguetis a la boloñesa': ['espaguetis', 'carne-picada', 'tomate'],
  'Gazpacho andaluz': ['tomate', 'pepino', 'pimiento-verde'],
  'Lentejas estofadas': ['lentejas', 'chorizo', 'zanahoria'],
  'Pollo al horno con patatas': ['pollo', 'patata', 'limon'],
  'Salmón al horno con verduras': ['salmon', 'calabacin', 'limon'],
  'Macarrones con chorizo': ['macarrones', 'chorizo', 'tomate'],
  'Tacos de carne': ['tortilla-trigo', 'carne-picada', 'aguacate'],
  'Pizza casera': ['pizza', 'mozzarella', 'tomate'],
  'Crema de calabacín': ['calabacin', 'patata', 'nata'],
  'Tortitas americanas': ['huevos', 'harina', 'miel'],
  'Arroz con leche': ['arroz', 'leche', 'limon'],
  'Ensalada completa': ['lechuga', 'tomate', 'huevos'],
  'Hummus de garbanzos': ['garbanzos', 'limon', 'ajo'],
}

export function recipeDrawings(name: string): string[] {
  return (RECIPE_DRAWINGS[name] ?? ['bolsa']).map(drawingUrl)
}

export function categoryDrawingUrl(categoryName: string | null): string {
  return drawingUrl(categoryDrawing(categoryName))
}
