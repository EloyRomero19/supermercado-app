// Tipos de la API del backend (deben coincidir con los records Java)

export type User = {
  id: string
  email: string
  displayName: string
}

/** Respuesta de /api/auth/register, /login, /refresh y /reset-password. El refresh token viaja en una cookie HttpOnly. */
export type AuthResponse = {
  accessToken: string
  expiresIn: number
  user: User
}

/** Formato de error del backend (RFC 9457) */
export type ProblemDetail = {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string>
}

export type Product = {
  id: number
  name: string
  icon: string
  categoryId: number
  categoryName: string
}

export type Category = {
  id: number
  name: string
  sortOrder: number
}

export type ListRole = 'OWNER' | 'MEMBER'

export type ListSummary = {
  id: string
  name: string
  myRole: ListRole
  memberCount: number
  itemCount: number
  checkedCount: number
}

export type Member = {
  userId: string
  displayName: string
  role: ListRole
}

export type ListDetail = {
  id: string
  name: string
  inviteCode: string
  myRole: ListRole
  members: Member[]
}

export type Item = {
  id: string
  productId: number | null
  name: string
  /** Emoji del producto; en los escritos a mano lo deduce el backend del texto (null si no lo reconoce) */
  icon: string | null
  categoryId: number | null
  categoryName: string | null
  categoryOrder: number | null
  quantity: number
  note: string | null
  checked: boolean
  checkedByName: string | null
  checkedAt: string | null
  addedByName: string | null
  createdAt: string
}

/** Producto usado recientemente en una lista (productId del catálogo, o customName si es texto libre). */
export type RecentItem = {
  productId: number | null
  customName: string | null
  name: string
  icon: string | null
  categoryId: number | null
  categoryName: string | null
  categoryOrder: number | null
  lastUsedAt: string
}

export type Difficulty = 'Fácil' | 'Media' | 'Difícil'

export type RecipeSummary = {
  id: number
  name: string
  emoji: string
  description: string
  minutes: number
  servings: number
  difficulty: Difficulty
  ingredientCount: number
}

/** Ingrediente de una receta: un producto del catálogo más la cantidad ("1 kg", "al gusto"…). */
export type Ingredient = {
  productId: number
  name: string
  icon: string
  categoryId: number
  categoryName: string
  categoryOrder: number
  amount: string
}

export type RecipeDetail = Omit<RecipeSummary, 'ingredientCount'> & {
  ingredients: Ingredient[]
  steps: string[]
}
