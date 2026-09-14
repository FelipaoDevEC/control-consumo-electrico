INSERT INTO medidores (
    nombre
)
SELECT
    'Medidor principal'
WHERE NOT EXISTS (
    SELECT 1
    FROM medidores
    WHERE nombre = 'Medidor principal'
);