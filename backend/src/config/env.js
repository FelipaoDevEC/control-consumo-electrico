import 'dotenv/config';

function requerirVariable(nombre) {
    const valor = process.env[nombre];

    if (!valor) {
        throw new Error(
            `Falta la variable de entorno obligatoria: ${nombre}`
        );
    }

    return valor;
}

export const env = {
    db: {
        host: requerirVariable('DB_HOST'),
        port: Number(process.env.DB_PORT ?? 5432),
        name: requerirVariable('DB_NAME'),
        user: requerirVariable('DB_USER'),
        password: requerirVariable('DB_PASSWORD'),
    },
};