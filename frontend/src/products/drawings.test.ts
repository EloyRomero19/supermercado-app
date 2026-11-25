import { describe, expect, it } from 'vitest'
import { categoryDrawingUrl, matchDrawing, productDrawing, recipeDrawings } from './drawings'

/** El catálogo de V2__catalog.sql (si se amplía, añadir aquí los nuevos). */
const CATALOG = [
  'Aguacate',
  'Ajo',
  'Berenjena',
  'Brócoli',
  'Calabacín',
  'Calabaza',
  'Cebolla',
  'Champiñones',
  'Coliflor',
  'Espinacas',
  'Fresas',
  'Judías verdes',
  'Kiwi',
  'Lechuga',
  'Limón',
  'Mandarina',
  'Manzana',
  'Melocotón',
  'Melón',
  'Naranja',
  'Patata',
  'Pepino',
  'Pera',
  'Perejil',
  'Pimiento rojo',
  'Pimiento verde',
  'Piña',
  'Plátano',
  'Puerro',
  'Sandía',
  'Tomate',
  'Uvas',
  'Zanahoria',
  'Alitas de pollo',
  'Carne picada',
  'Chorizo fresco',
  'Chuletas de cordero',
  'Costillas de cerdo',
  'Filetes de ternera',
  'Hamburguesas',
  'Lomo de cerdo',
  'Muslos de pollo',
  'Pavo en filetes',
  'Pechuga de pollo',
  'Pollo entero',
  'Salchichas',
  'Solomillo de cerdo',
  'Atún fresco',
  'Bacalao',
  'Boquerones',
  'Calamares',
  'Dorada',
  'Gambas',
  'Lubina',
  'Mejillones',
  'Merluza',
  'Pulpo',
  'Salmón',
  'Sardinas',
  'Bacon',
  'Chorizo',
  'Fuet',
  'Jamón cocido',
  'Jamón serrano',
  'Lomo embuchado',
  'Mozzarella',
  'Pechuga de pavo',
  'Queso curado',
  'Queso en lonchas',
  'Queso fresco',
  'Queso rallado',
  'Queso semicurado',
  'Salchichón',
  'Bebida de avena',
  'Bebida de soja',
  'Flan',
  'Huevos',
  'Kéfir',
  'Leche desnatada',
  'Leche entera',
  'Leche semidesnatada',
  'Leche sin lactosa',
  'Mantequilla',
  'Nata para cocinar',
  'Nata para montar',
  'Natillas',
  'Yogur griego',
  'Yogur natural',
  'Yogures de sabores',
  'Bizcocho',
  'Croissants',
  'Magdalenas',
  'Masa de pizza',
  'Pan de barra',
  'Pan de molde',
  'Pan integral',
  'Pan rallado',
  'Picos',
  'Tortillas de trigo',
  'Tostadas',
  'Aceite de girasol',
  'Aceite de oliva',
  'Aceite de oliva virgen extra',
  'Aceitunas',
  'Almendras',
  'Alubias',
  'Arroz',
  'Arroz integral',
  'Atún en lata',
  'Azúcar',
  'Caldo de pollo',
  'Comino',
  'Cuscús',
  'Espaguetis',
  'Espárragos en conserva',
  'Fideos',
  'Frutos secos',
  'Garbanzos',
  'Harina',
  'Ketchup',
  'Lentejas',
  'Levadura',
  'Macarrones',
  'Mayonesa',
  'Maíz dulce',
  'Mostaza',
  'Nueces',
  'Orégano',
  'Pasta de lasaña',
  'Patatas fritas',
  'Pepinillos',
  'Pimentón',
  'Pimienta negra',
  'Quinoa',
  'Sal',
  'Sardinas en lata',
  'Tomate frito',
  'Tomate triturado',
  'Vinagre',
  'Cacao en polvo',
  'Café en cápsulas',
  'Café molido',
  'Café soluble',
  'Cereales',
  'Chocolate',
  'Copos de avena',
  'Crema de cacao',
  'Galletas',
  'Infusión de manzanilla',
  'Mermelada',
  'Miel',
  'Turrón',
  'Té',
  'Croquetas',
  'Espinacas congeladas',
  'Gambas congeladas',
  'Guisantes congelados',
  'Helado',
  'Hielo',
  'Lasaña congelada',
  'Patatas fritas congeladas',
  'Pizza congelada',
  'San Jacobos',
  'Varitas de merluza',
  'Verduras congeladas',
  'Agua',
  'Agua con gas',
  'Bebida isotónica',
  'Cava',
  'Cerveza',
  'Cerveza sin alcohol',
  'Gazpacho',
  'Horchata',
  'Refresco de cola',
  'Refresco de limón',
  'Tónica',
  'Vino blanco',
  'Vino tinto',
  'Zumo de naranja',
  'Zumo de piña',
  'Ambientador',
  'Bayetas',
  'Bolsas de basura',
  'Detergente',
  'Estropajos',
  'Film transparente',
  'Friegasuelos',
  'Lavavajillas',
  'Lejía',
  'Limpiacristales',
  'Limpiador multiusos',
  'Papel de aluminio',
  'Papel de cocina',
  'Pastillas lavavajillas',
  'Quitagrasas',
  'Suavizante',
  'Algodón',
  'Bastoncillos',
  'Cepillo de dientes',
  'Champú',
  'Compresas',
  'Crema hidratante',
  'Desodorante',
  'Enjuague bucal',
  'Gel de ducha',
  'Jabón de manos',
  'Maquinillas de afeitar',
  'Papel higiénico',
  'Pasta de dientes',
  'Pañuelos de papel',
  'Protector solar',
  'Tampones',
  'Arena para gato',
  'Comida para gato',
  'Comida para perro',
  'Leche infantil',
  'Pañales',
  'Potitos',
  'Snacks para perro',
  'Toallitas',
]

// Qué dibujos hay en public/dibujos (Vite lista los archivos sin leerlos)
const FILES = new Set(Object.keys(import.meta.glob('../../public/dibujos/*.svg')).map((path) => `/dibujos/${path.split('/').pop()}`))
const exists = (url: string) => FILES.has(url)

describe('matchDrawing', () => {
  it.each(CATALOG)('«%s» tiene un dibujo propio que existe', (name) => {
    const key = matchDrawing(name)
    expect(key).not.toBeNull()
    expect(exists(`/dibujos/${key}.svg`)).toBe(true)
  })

  it('lo más concreto gana a lo general', () => {
    expect(matchDrawing('Tomate frito')).toBe('tomate-frito')
    expect(matchDrawing('Tomate')).toBe('tomate')
    expect(matchDrawing('Pan rallado')).toBe('harina')
    expect(matchDrawing('Pan de barra')).toBe('baguette')
    expect(matchDrawing('Leche infantil')).toBe('biberon')
    expect(matchDrawing('Patatas fritas congeladas')).toBe('fritas')
  })

  it('reconoce lo escrito a mano: plurales, mayúsculas y tildes', () => {
    expect(matchDrawing('tomates')).toBe('tomate')
    expect(matchDrawing('LIMONES')).toBe('limon')
    expect(matchDrawing('una barra de pan')).toBe('baguette')
    expect(matchDrawing('leche sin lactosa')).toBe('leche')
    expect(matchDrawing('platano de canarias')).toBe('platano')
  })

  it('compara palabras enteras: «lechuga» no es «leche» ni «natillas» es «nata»', () => {
    expect(matchDrawing('lechuga')).toBe('lechuga')
    expect(matchDrawing('natillas')).toBe('natillas')
  })

  it('devuelve null si no lo reconoce', () => {
    expect(matchDrawing('Pilas AA')).toBeNull()
  })
})

describe('productDrawing', () => {
  it('sin dibujo propio usa el de su sección, y si no la bolsa', () => {
    expect(productDrawing('Pilas AA', 'Limpieza')).toBe('/dibujos/detergente.svg')
    expect(productDrawing('Pilas AA', null)).toBe('/dibujos/bolsa.svg')
  })
})

describe('dibujos de secciones y recetas', () => {
  it('existen todos', () => {
    const sections = ['Frutas y verduras', 'Carnicería', 'Pescadería', 'Charcutería y quesos', 'Lácteos y huevos', 'Panadería y bollería',
      'Despensa', 'Desayuno y dulces', 'Congelados', 'Bebidas', 'Limpieza', 'Higiene y cuidado personal', 'Bebé y mascotas']
    for (const section of sections) expect(exists(categoryDrawingUrl(section))).toBe(true)
    const recipes = ['Tortilla de patatas', 'Paella mixta', 'Espaguetis a la boloñesa', 'Gazpacho andaluz', 'Lentejas estofadas',
      'Pollo al horno con patatas', 'Salmón al horno con verduras', 'Macarrones con chorizo', 'Tacos de carne', 'Pizza casera',
      'Crema de calabacín', 'Tortitas americanas', 'Arroz con leche', 'Ensalada completa', 'Hummus de garbanzos']
    for (const recipe of recipes) for (const url of recipeDrawings(recipe)) expect(exists(url)).toBe(true)
  })
})
