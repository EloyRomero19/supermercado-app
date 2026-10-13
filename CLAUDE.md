# Supermercado App — lista de la compra compartida (PWA)

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
- **Frontend** (`frontend/`): React 19, Vite 8, TypeScript 6, oxlint.
- **BD**: PostgreSQL 18 en Docker (`docker-compose.yml` en la raíz).

## Comandos
```bash
cp .env.example .env              # primera vez; rellenar secretos
docker compose up -d              # arrancar Postgres
docker compose ps                 # debe estar "healthy"
docker compose down               # parar (añadir -v borra los datos)

cd backend && ./mvnw spring-boot:run
cd backend && ./mvnw test        # necesita Docker (Testcontainers arranca su propio Postgres)

cd frontend && npm run dev        # http://localhost:5173
cd frontend && npm run build
cd frontend && npm run lint
```

## Arquitectura backend
- Paquetes por funcionalidad bajo `com.miapp.backend`: `auth`, `user`, `product`, `list`, `item`, `realtime`, `common`.
- Capas: `Controller` → `Service` → `Repository`. La lógica y la autorización viven en el servicio.
- DTOs de entrada/salida como `record` con Bean Validation. **Nunca** se devuelven entidades JPA.
- Errores con `ProblemDetail` (RFC 9457) desde un `@RestControllerAdvice` en `common`.
- Eventos de tiempo real publicados con `@TransactionalEventListener(phase = AFTER_COMMIT)`.

## Convenciones
- Código, identificadores y nombres de tablas en inglés; textos de UI en español.
- Esquema gestionado **solo** por Flyway (`backend/src/main/resources/db/migration/V{n}__descripcion.sql`).
  Nunca editar una migración ya aplicada: crear una nueva. JPA con `ddl-auto=validate`.
- IDs `uuid` para entidades expuestas (usuarios, listas, items); `timestamptz` para fechas.
- Endpoints REST bajo `/api`. El frontend llama a la API siempre a través de `frontend/src/api/`.
- En desarrollo, Vite hace proxy de `/api`, `/oauth2` y `/login/oauth2` a `http://localhost:8080` (mismo origen, sin CORS).

## Reglas de seguridad
- Secretos solo en variables de entorno (`.env`, ignorado por git). `.env.example` documenta las variables.
- Contraseñas con BCrypt (8–72 bytes). Login con mensaje genérico de error.
- Access token JWT (HS256, 15 min) **solo en memoria** en el frontend; nunca en `localStorage`.
- Refresh token opaco en cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, guardado en BD como SHA-256, con rotación y revocación de familia si se reutiliza.
- Login con Google por el flujo OAuth2 del backend; el JWT nunca viaja en la URL.
- Toda operación sobre una lista comprueba pertenencia en el servicio (`requireMember` / `requireOwner`).
  A un no-miembro se le responde **404**. Los items se buscan siempre por `(listId, itemId)`.
- SSE autenticado con `Authorization: Bearer` (cliente `@microsoft/fetch-event-source`).

## Plan por fases
Plan completo (esquema de BD, endpoints, seguridad): `~/.claude/plans/estoy-creando-una-pwa-delightful-hejlsberg.md`

- [x] 0. Infraestructura: docker-compose, `.env.example`, este archivo
- [x] 1. Base backend: configuración (`.env` importado), Flyway V1 (usuarios y tokens), Testcontainers, proxy Vite
- [x] 2. Auth email/contraseña + JWT (añadir `spring-boot-starter-security-oauth2-resource-server`), errores `ProblemDetail`
- [ ] 3. Frontend base: router, `AuthContext`, cliente API, login/registro
- [ ] 4. Login con Google
- [ ] 5. Catálogo y buscador (`pg_trgm` + `unaccent`)
- [ ] 6. Listas, miembros e invitaciones
- [ ] 7. Items de la lista
- [ ] 8. Tiempo real con SSE
- [ ] 9. PWA (`vite-plugin-pwa`)
- [ ] 10. Endurecimiento (rate limiting) y despliegue (Docker + Caddy)
