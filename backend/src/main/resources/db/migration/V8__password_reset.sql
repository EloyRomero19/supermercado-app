-- Se quita el login con Google: solo email y contraseña.
-- Quien entraba solo con Google no tiene contraseña (password_hash NULL). No puede iniciar sesión,
-- pero sí crearse una con "¿Has olvidado tu contraseña?", que demuestra que el email es suyo.
ALTER TABLE app_user DROP CONSTRAINT app_user_has_credentials;
ALTER TABLE app_user DROP COLUMN google_sub;
-- La foto de perfil solo venía de Google
ALTER TABLE app_user DROP COLUMN avatar_url;

-- Enlaces de "restablecer contraseña". Como con los refresh tokens, solo se guarda el SHA-256 (hex):
-- quien lea la base de datos no puede usar los enlaces. Un solo uso (used_at) y caducidad corta.
CREATE TABLE password_reset_token (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    token_hash char(64)    NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX password_reset_token_user_idx ON password_reset_token (user_id);
