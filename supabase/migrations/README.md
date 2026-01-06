# Database Migrations

Este directorio contiene las migraciones de base de datos versionadas para el proyecto de finanzas personales.

## Estructura

```
migrations/
├── README.md
├── 001_initial_schema.sql
├── 002_add_savings_goals.sql
└── ...
```

## Naming Convention

- Usa números secuenciales con padding de 3 dígitos: `001_`, `002_`, etc.
- Nombres descriptivos en snake_case
- Ejemplos:
  - `001_initial_schema.sql`
  - `002_add_savings_goals.sql`
  - `003_add_user_preferences.sql`

## Cómo crear una nueva migración

1. Crea un nuevo archivo con el siguiente número en secuencia
2. Incluye tanto la migración UP como DOWN en el mismo archivo:

```sql
-- Migration: Add new feature
-- Created: 2026-01-05

-- UP
CREATE TABLE example (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL
);

-- DOWN (commented for rollback reference)
-- DROP TABLE IF EXISTS example;
```

## Aplicar migraciones

### Desarrollo local
```bash
npm run migrate:dev
```

### Producción
```bash
npm run migrate:prod
```

## Rollback

Para revertir la última migración:
```bash
npm run migrate:rollback
```

## Best Practices

1. **Nunca edites migraciones aplicadas** - Crea una nueva migración
2. **Incluye índices** para optimizar queries
3. **Añade RLS policies** en la misma migración que la tabla
4. **Documenta cambios complejos** con comentarios
5. **Prueba rollbacks** antes de aplicar en producción
6. **Usa transacciones** para operaciones atómicas

## Verificar estado

```bash
npm run migrate:status
```

Esto mostrará qué migraciones están aplicadas y cuáles están pendientes.
