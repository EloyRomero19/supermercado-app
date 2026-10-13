-- Usuarios: pueden entrar con contraseña, con Google o con ambos.
CREATE TABLE app_user (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         varchar(254) NOT NULL,
    display_name  varchar(100) NOT NULL,
    password_hash varchar(100),
    google_sub    varchar(255) UNIQUE,
    avatar_url    varchar(500),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT app_user_has_credentials CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL)
);

-- "Ana@Mail.com" y "ana@mail.com" son el mismo usuario.
CREATE UNIQUE INDEX app_user_email_lower_uk ON app_user (lower(email));

-- Refresh tokens: solo se guarda el hash SHA-256 (hex), nunca el token en claro.
-- family_id agrupa las rotaciones de un mismo login para revocarlas juntas.
CREATE TABLE refresh_token (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    token_hash char(64)    NOT NULL UNIQUE,
    family_id  uuid        NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_token_user_idx ON refresh_token (user_id);
CREATE INDEX refresh_token_family_idx ON refresh_token (family_id);
