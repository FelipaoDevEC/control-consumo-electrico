CREATE TABLE sesiones (
    id_sesion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario BIGINT NOT NULL
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,
    token_hash VARCHAR(64) NOT NULL UNIQUE
        CHECK (CHAR_LENGTH(token_hash) = 64),
    expira_en TIMESTAMPTZ NOT NULL,
    ultimo_uso_en TIMESTAMPTZ,
    revocada_en TIMESTAMPTZ,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);