# ¿Qué falta? — lo que falta en casa, a un toque (PWA de listas de la compra compartidas)

PWA para gestionar listas de la compra compartidas entre varios usuarios:
1. Login con email/contraseña (JWT) y con Google.
2. Buscador de productos (catálogo propio + productos de texto libre).
3. Varias listas por usuario, compartidas mediante código de invitación (roles `OWNER` / `MEMBER`).
4. Marcar productos como cogidos en tiempo real (SSE).

## Modo de trabajo (importante)
- El usuario está **aprendiendo**. Claude escribe el código y **explica el porqué** de cada pieza.
- Ritmo: una **fase completa por turno** (código + tests + verificación) sin pausas entre sub-pasos.
  Al final de la fase: resumen de lo hecho y de los conceptos importantes, y preguntar antes de la siguiente.
- Una rama por fase (`fase-N-descripcion`); no adelantar trabajo de fases futuras sin preguntar.
- Comunicación en español.

## Stack
- **Backend** (`backend/`): Spring Boot 4.1, Java 21, Maven wrapper. Web MVC, Data JPA, Security, OAuth2 Client, Validation, Flyway, Lombok.
- **Frontend** (`frontend/`): React 19, Vite 8, TypeScript 6, Tailwind CSS 4, shadcn/ui (Radix), lucide-react, sonner, oxlint.
- **BD**: PostgreSQL 18 en Docker (`docker-compose.yml` en la raíz).

## Comandos
```bash
cp .env.example .env              # primera vez; rellenar secretos
docker compose up -d              # arrancar Postgres
docker compose ps                 # debe estar "healthy"
docker compose down               # parar (añadir -v borra los datos)

cd backend && ./mvnw spring-boot:run
cd backend && ./mvnw test        # necesita Docker (Testcontainers arranca su propio Postgres)
                                  # config de tests: backend/src/test/resources/config/application.yml (no usa .env)

cd frontend && npm run dev        # http://localhost:5173
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm test          # Vitest
cd frontend && npm run build && npm run preview   # build de producción con service worker (http://localhost:4173)
cd frontend && npm run generate-pwa-assets         # regenerar iconos desde public/favicon.svg

docker compose -f docker-compose.prod.yml up -d --build   # producción (ver README); necesita DOMAIN y PUBLIC_URL
```

## Arquitectura backend
- Paquetes por funcionalidad bajo `com.miapp.backend`: `auth`, `user`, `product`, `list`, `item`, `recipe`, `realtime`, `common`.
- Capas: `Controller` → `Service` → `Repository`. La lógica y la autorización viven en el servicio.
- DTOs de entrada/salida como `record` con Bean Validation. **Nunca** se devuelven entidades JPA.
- Errores con `ProblemDetail` (RFC 9457) desde un `@RestControllerAdvice` en `common`.
- Búsqueda de productos con SQL nativo (`JdbcClient`) sobre `product.search_name` (normalizado como `ProductService.normalize`):
  primero por inicio de palabra; si no hay resultados, por similitud (`pg_trgm`, umbral 0.4 con `SET LOCAL`).
- Tests: `@SpringBootTest` + `@Import(TestcontainersConfiguration.class)`; `TestUsers.registerAndGetBearer(mvc)` para peticiones autenticadas.
- Rate limiting en `ratelimit.RateLimitInterceptor` (reglas por ruta, por IP o por usuario); desactivado en tests (`app.rate-limit.enabled`).
- Producción: Caddy (`frontend/Caddyfile`) sirve la SPA, hace proxy de `/api`, `/oauth2`, `/login/oauth2` y pone HTTPS y la CSP.
  Si se añaden orígenes externos (imágenes, scripts…), hay que permitirlos en la CSP. `style-src` admite `'unsafe-inline'`
  porque sonner y Radix insertan `<style>` en tiempo de ejecución (scripts en línea siguen prohibidos).
- Usuario actual en controladores: `@CurrentUserId UUID userId` (meta-anotación de `@AuthenticationPrincipal`).
- Invitaciones: QR (qrcode.react) con el enlace `/unirse/:codigo` + botón "Compartir enlace"; desde "Mis listas ▾" (o la pantalla sin listas), "Unirse con un enlace" abre un modal (`lists/JoinListDialog`) donde se pega (`extractInviteCode`).
- Autorización de listas SIEMPRE con `ListAccessService.requireMember/requireOwner` (404 a no-miembros, 403 a miembros sin permiso).
- Entidades con clave asignada por nosotros (p. ej. `ListMember`) implementan `Persistable` para que `save()` haga INSERT y no merge.
- Items siempre por `(listId, itemId)` (`findByIdAndListId`) para evitar IDOR. `ListItem` usa `@Version` (409 si hay edición concurrente).
- FKs cuyo nombre no sigue la convención JPA `<campo>_id` necesitan `@JoinColumn(name = ...)` (p. ej. `checked_by`, `added_by`).
- Tiempo real: los servicios publican `common.ListEvent` (tipos en sus constantes) con `ApplicationEventPublisher`;
  `realtime.ListEventBroadcaster` los envía por SSE con `@TransactionalEventListener(AFTER_COMMIT)`.
  Las conexiones viven en memoria (`ListSubscriptions`): con varias instancias habría que usar p. ej. LISTEN/NOTIFY.
  Todo cambio nuevo en listas/items debe publicar su evento y aplicarse en `frontend/src/lists/listEvents.ts`.

## Convenciones
- Código, identificadores y nombres de tablas en inglés; textos de UI en español.
- Esquema gestionado **solo** por Flyway (`backend/src/main/resources/db/migration/V{n}__descripcion.sql`).
  Nunca editar una migración ya aplicada: crear una nueva. JPA con `ddl-auto=validate`.
- IDs `uuid` para entidades expuestas (usuarios, listas, items); `timestamptz` para fechas.
- Endpoints REST bajo `/api`. El frontend llama a la API siempre a través de `frontend/src/api/`.
- Frontend: `src/api/` (cliente `api()` con token en memoria y refresh automático, uno por vez y con Web Locks entre pestañas),
  `src/auth/` (`AuthProvider`, `useAuth`, `RequireAuth`/`GuestOnly`), `src/pages/`, `src/components/`. React Router 8 en modo declarativo.
- PWA: el service worker NO debe interceptar `/api`, `/oauth2`, `/login/oauth2` (`navigateFallbackDenylist`) ni cachear la API
  (datos privados). Solo se cachea el app shell. Nuevas versiones con aviso (`UpdatePrompt`), no automáticas.
- Productos escritos a mano: icono y sección deducidos al leer (`product.CustomItemIcons` + `IconGuesser`): primero el catálogo,
  luego el diccionario `backend/src/main/resources/custom-item-icons.txt` (palabras en singular, sin tildes). Ampliar ahí.
- "Utilizados recientemente": tabla `list_recent_item` (V6), se actualiza con un upsert al añadir un producto
  (`RecentItemRepository`). En el frontend, `applyListEvent` lo actualiza con cada producto nuevo que llega por SSE.
- Navegación: las páginas con sesión cuelgan de `layout/AppLayout` (barra inferior `TabBar`: Listas, Recetas, Cuenta).
  Pestaña Listas (`/`, `HomePage`) = redirige a la lista principal (`pickListToShop`: la última abierta o la de más pendientes);
  solo muestra contenido si no hay listas. Se cambia de lista con `lists/ListSwitcher` (título "Mis listas ▾", DropdownMenu con
  `modal={false}`), que también abre `NewListDialog`/`JoinListDialog`. `ListRoute` monta `ListPage` con `key={listId}`.
  Recetas (`pages/RecipesPage`, `RecipePage`): tablas `recipe`/`recipe_ingredient` (V7, ingredientes = productos del catálogo);
  muestra qué falta en la lista elegida (`recipes/missingIngredients`, por defecto `pickListToShop`) y lo añade con
  `POST /api/lists/{id}/items/bulk` (una transacción: todo o nada). Nuevas recetas = nueva migración. Lista = SOLO lo que falta, en tarjetas agrupadas por sección (`items/ItemList`; un toque = al carrito,
  con confirmación de 450 ms en la tarjeta). Lo cogido vive en `items/Cart` (barra fija + panel: devolver, "Terminar la compra").
- Diseño: Tailwind 4 + shadcn/ui. Tokens (colores OKLCH con contraste AA comprobado, radios, fuente Inter, animaciones) SOLO en
  `src/index.css`; los componentes usan clases (`bg-primary`, `text-muted-foreground`…), nunca colores sueltos. Modo oscuro con
  `<html data-theme>` (Automático/Claro/Oscuro en Cuenta, `src/theme/theme.ts`; `public/theme-init.js` lo aplica antes de pintar,
  en archivo aparte por la CSP) y `@custom-variant dark` para las clases `dark:`. Colores de sección = tokens `--cat-N` (`items/categoryStyle.ts`), aplicados con `--tone` + `bg-tone-soft`.
  Componentes shadcn en `src/components/ui/` (generados por la CLI; tras `npx shadcn add`, revisar que importen `cn` de `@/lib/utils`
  y no instalen el paquete npm `cn`). Avisos con `toast` de sonner; confirmaciones con `useConfirm`; respetar `prefers-reduced-motion`.
- En desarrollo, Vite hace proxy de `/api`, `/oauth2` y `/login/oauth2` a `http://localhost:8080` (mismo origen, sin CORS).

## Reglas de seguridad
- Secretos solo en variables de entorno (`.env`, ignorado por git). `.env.example` documenta las variables.
- Contraseñas con BCrypt (8–72 bytes). Login con mensaje genérico de error.
- Access token JWT (HS256, 15 min) **solo en memoria** en el frontend; nunca en `localStorage`.
- Refresh token opaco en cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, guardado en BD como SHA-256, con rotación y revocación de familia si se reutiliza.
- Login con Google por el flujo OAuth2 del backend (cadena `@Order(1)` en `/oauth2/**` y `/login/oauth2/**`, única con sesión);
  el JWT nunca viaja en la URL. Se enlaza con una cuenta existente solo si Google verifica el email, y entonces se anula la contraseña.
- En `.env`, una variable vacía (`VAR=`) anula el valor por defecto `${VAR:def}`: comentar las que no se usen.
- Toda operación sobre una lista comprueba pertenencia en el servicio (`requireMember` / `requireOwner`).
  A un no-miembro se le responde **404**. Los items se buscan siempre por `(listId, itemId)`.
- SSE autenticado con `Authorization: Bearer` (cliente `@microsoft/fetch-event-source`).

## Plan por fases
Plan completo (esquema de BD, endpoints, seguridad): `~/.claude/plans/estoy-creando-una-pwa-delightful-hejlsberg.md`

- [x] 0. Infraestructura: docker-compose, `.env.example`, este archivo
- [x] 1. Base backend: configuración (`.env` importado), Flyway V1 (usuarios y tokens), Testcontainers, proxy Vite
- [x] 2. Auth email/contraseña + JWT (añadir `spring-boot-starter-security-oauth2-resource-server`), errores `ProblemDetail`
- [x] 3. Frontend base: router, `AuthContext`, cliente API, login/registro
- [x] 4. Login con Google
- [x] 5. Catálogo y buscador (`pg_trgm` + `unaccent`)
- [x] 6. Listas, miembros e invitaciones
- [x] 7. Items de la lista
- [x] 8. Tiempo real con SSE
- [x] 9. PWA (`vite-plugin-pwa`)
- [x] 10. Endurecimiento (rate limiting) y despliegue (Docker + Caddy)
