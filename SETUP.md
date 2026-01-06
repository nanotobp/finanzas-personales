# Guía de Configuración

## 1. Configurar Supabase

### Crear Proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Espera a que se inicialice (2-3 minutos)

### Ejecutar Migraciones
1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia y ejecuta el contenido de `supabase/schema.sql`
3. Luego ejecuta `supabase/storage.sql`

### Obtener Credenciales
1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Configurar Storage
1. Ve a **Storage** en el panel de Supabase
2. Verifica que el bucket `attachments` se creó
3. Si no existe, créalo manualmente con las políticas RLS definidas

## 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Instalar Dependencias

```bash
npm install
```

## 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 5. Crear Primera Cuenta

1. Ve a `/signup`
2. Crea una cuenta
3. Se crearán automáticamente:
   - Perfil de usuario
   - Categorías por defecto (gastos e ingresos)

## 6. Usar el Sistema

### Quick Add (⌘K o Ctrl+K)
- Presiona `⌘K` (Mac) o `Ctrl+K` (Windows/Linux)
- Registra gastos/ingresos rápidamente

### Navegación
- Usa la sidebar izquierda para navegar entre módulos
- Dashboard muestra resumen general
- Cada módulo tiene su propia vista

## 7. Deploy en Producción

### Vercel (Recomendado para Frontend)
```bash
npm install -g vercel
vercel
```

1. Conecta tu repositorio
2. Configura las variables de entorno en Vercel
3. Deploy automático en cada push

### Variables de Entorno en Vercel
En tu proyecto de Vercel, ve a **Settings** → **Environment Variables** y añade:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (tu dominio de producción)

## 8. Próximos Pasos

### Fase 1 (Completar MVP)
- [ ] CRUD completo de cuentas
- [ ] CRUD completo de categorías
- [ ] Filtros avanzados en gastos
- [ ] Página de ingresos funcional
- [ ] Presupuestos básicos

### Fase 2
- [ ] Tarjetas de crédito
- [ ] Clientes
- [ ] Reglas automáticas
- [ ] Import CSV

### Fase 3
- [ ] Conciliación avanzada
- [ ] Proyecciones
- [ ] Reportes exportables
- [ ] Notificaciones por email

## Troubleshooting

### Error de autenticación
- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de que las tablas tienen RLS habilitado
- Verifica que las políticas RLS permiten al usuario acceder

### No aparecen categorías
- Verifica que el trigger `on_profile_created` se ejecutó
- Puedes insertar categorías manualmente en SQL Editor

### Errores de CORS
- Verifica la URL de Supabase en `.env.local`
- En Supabase, ve a **Authentication** → **URL Configuration**
- Añade tu dominio local y de producción

## Soporte

Para problemas o preguntas:
1. Revisa la documentación de [Supabase](https://supabase.com/docs)
2. Revisa la documentación de [Next.js](https://nextjs.org/docs)
3. Revisa los logs del navegador y servidor
