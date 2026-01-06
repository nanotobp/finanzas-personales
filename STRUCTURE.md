# Estructura del Proyecto

```
finanzas-personales/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Rutas de autenticación
│   │   ├── login/
│   │   │   ├── page.tsx          # Página de login
│   │   │   └── login-form.tsx    # Formulario de login
│   │   └── signup/
│   │       ├── page.tsx          # Página de registro
│   │       └── signup-form.tsx   # Formulario de registro
│   ├── (dashboard)/               # Rutas protegidas del dashboard
│   │   ├── layout.tsx            # Layout con sidebar y header
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Página principal
│   │   ├── expenses/
│   │   │   └── page.tsx          # Lista de gastos
│   │   ├── income/
│   │   │   └── page.tsx          # Lista de ingresos
│   │   ├── accounts/
│   │   │   └── page.tsx          # Gestión de cuentas
│   │   ├── cards/
│   │   │   └── page.tsx          # Gestión de tarjetas
│   │   ├── budgets/
│   │   │   └── page.tsx          # Presupuestos
│   │   ├── subscriptions/
│   │   │   └── page.tsx          # Suscripciones
│   │   ├── clients/
│   │   │   └── page.tsx          # Clientes
│   │   ├── projects/
│   │   │   └── page.tsx          # Proyectos
│   │   ├── rules/
│   │   │   └── page.tsx          # Reglas automáticas
│   │   ├── reports/
│   │   │   └── page.tsx          # Reportes
│   │   └── settings/
│   │       └── page.tsx          # Configuración
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout raíz
│   ├── page.tsx                  # Página de inicio (redirect)
│   └── providers.tsx             # Providers (React Query)
├── components/                    # Componentes React
│   ├── ui/                       # Componentes UI (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── select.tsx
│   ├── dashboard/                # Componentes del dashboard
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── quick-add-button.tsx
│   │   ├── quick-add-dialog.tsx
│   │   ├── dashboard-stats.tsx
│   │   ├── dashboard-charts.tsx
│   │   ├── recent-transactions.tsx
│   │   └── upcoming-subscriptions.tsx
│   ├── expenses/
│   │   └── expenses-list.tsx
│   └── accounts/
│       └── accounts-list.tsx
├── lib/                          # Utilidades y configuración
│   ├── supabase/                 # Cliente Supabase
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server
│   │   └── middleware.ts         # Middleware para auth
│   └── utils.ts                  # Funciones helper
├── types/                        # TypeScript types
│   └── database.types.ts         # Tipos de Supabase
├── supabase/                     # SQL y configuración DB
│   ├── schema.sql                # Schema de base de datos
│   ├── storage.sql               # Configuración de storage
│   └── sample-data.sql           # Datos de ejemplo
├── middleware.ts                 # Next.js middleware (auth)
├── .env.example                  # Variables de entorno ejemplo
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── README.md
└── SETUP.md                      # Guía de configuración
```

## Módulos Implementados

### ✅ Completos
- **Auth**: Login y registro con Supabase
- **Dashboard**: Visualización general con gráficos ECharts
- **Quick Add**: Diálogo para añadir gastos/ingresos (⌘K)
- **Gastos**: Lista con filtros y búsqueda
- **Cuentas**: Vista de saldos y gestión

### 🚧 Pendientes (Placeholders)
- Ingresos
- Tarjetas
- Presupuestos
- Suscripciones
- Clientes
- Proyectos
- Reglas automáticas
- Reportes
- Configuración

## Base de Datos (Supabase)

### Tablas Principales
- `profiles` - Perfiles de usuario
- `categories` - Categorías de gastos/ingresos
- `accounts` - Cuentas bancarias
- `cards` - Tarjetas de crédito
- `transactions` - Transacciones (gastos/ingresos)
- `budgets` - Presupuestos mensuales
- `subscriptions` - Pagos recurrentes
- `clients` - Clientes (freelance)
- `projects` - Proyectos/centros de costo
- `attachments` - Archivos adjuntos
- `rules` - Reglas de automatización

### Características DB
- Row Level Security (RLS) habilitado
- Triggers automáticos:
  - Crear perfil al registrarse
  - Crear categorías por defecto
  - Actualizar timestamps
- Índices para performance
- Storage bucket para adjuntos

## Funcionalidades Clave

### Quick Add (⌘K)
- Atajo de teclado global
- Formulario minimalista
- Campos mínimos requeridos
- Botón flotante siempre visible

### Dashboard
- 4 KPIs principales
- 2 gráficos ECharts (pie + line)
- Transacciones recientes
- Próximas suscripciones

### Filtros y Búsqueda
- Por categoría
- Por texto
- Por mes
- Por estado

## Stack Tecnológico

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix UI)
- TanStack Query
- ECharts

### Backend
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage
- Row Level Security

### Desarrollo
- ESLint
- TypeScript
- Autoprefixer
- PostCSS

## Próximos Pasos de Desarrollo

1. **CRUD Completo**: Añadir creación/edición/eliminación en todas las entidades
2. **Presupuestos**: Sistema de alertas cuando se excede
3. **Tarjetas**: Gestión de períodos y pagos
4. **Import CSV**: Conciliación bancaria
5. **Reglas**: Motor de automatización
6. **Reportes**: Exportación a PDF/Excel
7. **Notificaciones**: Email/Push
8. **Mobile**: Responsive completo + PWA
