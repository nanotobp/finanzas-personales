# Finanzas Personales 💰

Sistema de gestión de finanzas personales diseñado para emprendedores que necesitan controlar sus finanzas sin abandonar la herramienta.

## 🚀 Características Principales

- 💰 **Quick Add**: Añade gastos/ingresos rápidamente (⌘K)
- 📊 **Dashboard**: Visualización clara con gráficos ECharts
- 🏦 **Bancos y Cuentas**: Gestión de múltiples cuentas
- 💳 **Tarjetas**: Control de deudas y pagos
- 📈 **Presupuestos**: Con alertas automáticas
- 🔄 **Suscripciones**: Tracking de pagos recurrentes
- 👥 **Clientes**: Para freelancers
- 🏷️ **Proyectos**: Centros de costo
- 🤖 **Reglas Automáticas**: Categorización inteligente
- 📥 **Conciliación**: Import CSV de bancos
- 📎 **Adjuntos**: Guarda tus facturas

## 📱 PWA - Aplicación Móvil

**NUEVO**: La aplicación ahora es una Progressive Web App completa que permite:

- ✅ **Instalable**: Instálala en tu teléfono como una app nativa
- ✅ **Offline**: Funciona sin conexión a internet
- ✅ **Cámara**: Subí facturas directamente desde tu móvil
- ✅ **Sincronización**: Los datos se sincronizan automáticamente cuando volvés online
- ✅ **Atajos rápidos**: Accesos directos para agregar gastos e ingresos
- ✅ **Notificaciones**: Alertas de presupuestos y vencimientos (próximamente)

Ver [PWA-SETUP.md](./PWA-SETUP.md) para más detalles sobre la configuración PWA.

## Stack Tecnológico

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: shadcn/ui + Radix UI
- **Charts**: ECharts
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query + Zustand

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Ejecutar migraciones de base de datos
# Ve a supabase/schema.sql y ejecuta en tu proyecto Supabase

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Estructura del Proyecto

```
├── app/                    # Vistas agrupadas por feature
│   ├── (auth)/            # Pantallas de autenticación
│   └── (dashboard)/       # Pantallas del dashboard
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── dashboard/        # Componentes del dashboard
│   ├── forms/            # Formularios
│   └── charts/           # Gráficos ECharts
├── lib/                  # Utilidades
│   ├── supabase/        # Cliente Supabase
│   ├── hooks/           # Custom hooks
│   └── utils/           # Helpers
├── types/               # TypeScript types
└── supabase/           # SQL schemas
```

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia las credenciales (URL + anon key)
3. Ejecuta las migraciones en `supabase/schema.sql`
4. Configura el bucket de storage para adjuntos

## Roadmap

### Fase 1 (MVP) ✅
- [x] Auth y usuarios
- [x] Cuentas bancarias
- [x] Gastos e ingresos
- [x] Quick Add
- [x] Dashboard básico
- [x] Presupuestos
- [x] Adjuntos

### Fase 2
- [ ] Tarjetas completas
- [ ] Clientes
- [ ] Reglas automáticas
- [ ] Cierre mensual

### Fase 3
- [ ] Conciliación CSV
- [ ] Proyecciones avanzadas
- [ ] Reportes por proyecto

## Licencia

MIT
