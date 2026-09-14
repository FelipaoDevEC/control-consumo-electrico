CREATE TABLE usuarios (
    id_usuario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL
        CHECK (rol IN ('ADMIN', 'USUARIO')),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    tema VARCHAR(20) NOT NULL DEFAULT 'SISTEMA'
        CHECK (tema IN ('SISTEMA', 'CLARO', 'OSCURO')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (BTRIM(nombre) <> ''),
    CHECK (BTRIM(correo) <> '')
);

CREATE UNIQUE INDEX ux_usuarios_correo_normalizado
ON usuarios (LOWER(BTRIM(correo)));

CREATE TABLE medidores (
    id_medidor BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT 'kWh'
        CHECK (unidad = 'kWh'),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (BTRIM(nombre) <> '')
);

CREATE TABLE lecturas_medidor (
    id_lectura BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_medidor BIGINT NOT NULL
        REFERENCES medidores(id_medidor)
        ON DELETE RESTRICT,
    id_usuario_registro BIGINT NOT NULL
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,
    id_usuario_actualizacion BIGINT
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,
    valor_lectura BIGINT NOT NULL
        CHECK (valor_lectura >= 0),
    fecha_lectura DATE NOT NULL,
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_medidor, fecha_lectura)
);