CREATE TABLE shopping_list (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar(100) NOT NULL,
    invite_code varchar(10)  NOT NULL UNIQUE,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- Quién pertenece a cada lista y con qué rol. La clave primaria (list_id, user_id)
-- impide que alguien esté dos veces en la misma lista.
CREATE TABLE list_member (
    list_id   uuid        NOT NULL REFERENCES shopping_list (id) ON DELETE CASCADE,
    user_id   uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    role      varchar(10) NOT NULL CHECK (role IN ('OWNER', 'MEMBER')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (list_id, user_id)
);

-- Para "mis listas": la PK empieza por list_id y no sirve para buscar por user_id
CREATE INDEX list_member_user_idx ON list_member (user_id);

-- Índice único parcial: como mucho un OWNER por lista (la BD lo garantiza, no solo el código)
CREATE UNIQUE INDEX list_member_one_owner_uk ON list_member (list_id) WHERE role = 'OWNER';
