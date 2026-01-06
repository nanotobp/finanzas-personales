blueprint completo (producto + módulos + pantallas + backend Laravel + data model + jobs + gráficos ECharts). Lo armé desktop-first pero responsive, pensado para que cargar datos sea fácil y no lo termines abandonando. 0) Principios de producto (para que no lo abandones) Quick Add siempre visible (botón flotante + ⌘K). Lo mínimo primero: monto + categoría + cuenta/tarjeta + fecha. El resto es opcional. Reglas automáticas: con el tiempo el sistema “aprende” (vos definís reglas). Conciliación: import CSV para “cerrar” realidad vs lo que cargaste. Meses cerrables: “cierre de mes” para no reescribir el pasado. 1) Módulos del sistema Dashboard Gastos Ingresos Bancos & Cuentas Tarjetas & Pagos Presupuestos & Alertas Suscripciones & Vencimientos Clientes (fijos/ocasionales) Adjuntos (facturas) Proyectos / Centros de costo Reglas automáticas Conciliación (CSV) Reportes + Exportación 2) Pantallas (UI) — Desktop-first, responsive 2.1 Dashboard (Home) Bloques: Saldo total (caja) + por cuenta Resumen del mes: ingresos, gastos, neto Presupuestos: barras por categoría Tarjetas: “deuda actual”, “pago próximo”, “corte” Suscripciones: próximas 4 Proyección: 30/60/90 días (si seguís así) Alertas: excediste / se vence / caja crítica Gráficos ECharts: Line: flujo de caja diario Bar apilado: gastos por categoría Pie: distribución de gastos Gauge: % presupuesto consumido Heatmap: gastos por día/hora (opcional) 2.2 Gastos Lista con filtros: mes / categoría / cuenta / tarjeta / proyecto / cliente Vista “Mes” tipo calendario (opcional) o tabla por días Quick Add: modal minimalista Adjuntar comprobante (subir foto → Drive/S3) Reglas sugeridas: “¿Siempre querés categorizar esto como X?” Estados del gasto: pending (cargado rápido) confirmed reconciled (conciliado con extracto) 2.3 Ingresos Ingreso libre + ingreso estándar (plantillas) Clasificación: servicios / pantallas / otros Asignación: ingreso → “fondos” (gastos fijos / ahorro / inversión / ocio) Cliente asociado (si aplica) Recurrente (mensual, quincenal, etc.) ECharts: Bar: ingresos por tipo (servicios/pantallas) Line: tendencia mensual 2.4 Bancos & Cuentas Bancos (entidad) + cuentas (caja, ahorro, etc.) Saldos (manual o por conciliación) Transferencias internas (cuenta A → cuenta B) Import CSV por cuenta 2.5 Tarjetas & Pagos Tarjetas: banco, límite, cierre, vencimiento, moneda Gastos en tarjeta → agrupar por período Pagos de tarjeta (movimientos) y “estado de deuda” Alertas: “te falta pagar X antes de Y” Opción: prorrateo de cuotas (si usás cuotas) ECharts: Donut: deuda por tarjeta Timeline: deuda vs límite 2.6 Presupuestos & Alertas Presupuesto mensual por categoría (y opcional por proyecto) Alertas: 80% consumido 100% excedido proyección: “en X días te quedás sin caja” Alertas por inactividad: “no cargaste gastos en 5 días” 2.7 Suscripciones & Vencimientos Suscripciones: nombre, categoría, costo, periodicidad, medio de pago, próxima fecha Vencimientos: suscripciones dominios hosting servicios impuestos (si querés) Alertas por email/WhatsApp/notification (según canal) 2.8 Clientes CRUD clientes Tipo: fijo / ocasional Importe fijo mensual (si fijo) Historial de ingresos Estado: activo/pausado Tags: “pantallas”, “servicios”, “agencia”, etc. Dashboard cliente: facturación por mes ingresos proyectados por recurrentes 2.9 Adjuntos (facturas) Subida desde gastos/ingresos Guardado en: Google Drive (vía API) o S3 compatible (Cloudflare R2 ideal) + link Metadata: proveedor, nro factura, fecha, monto Vista “Bandeja de adjuntos” para ordenar después 2.10 Proyectos / Centros de costo “Proyecto” (Cuponera, Sitiando, pantallas, etc.) Todo gasto/ingreso puede tener proyecto Reportes por proyecto (rentabilidad) 2.11 Reglas automáticas Motor simple: Si merchant contains "NETFLIX" → categoría Suscripciones Si tarjeta = ueno y merchant contains "SHELL" → Combustible UI: listado de reglas prioridad activar/desactivar 2.12 Conciliación (CSV) Importar extracto Match automático por: monto fecha cercana merchant similar Resultado: conciliado ✅ pendiente ⚠️ no encontrado ❌ (te faltó cargarlo) duplicado ♻️ 3) Modelo de datos (Laravel) — tablas clave Te dejo las entidades principales (sin SQL todavía, pero lista para migraciones): Core users currencies (opcional) projects categories (type: expense/income) tags (opcional) Bancos / cuentas / movimientos banks accounts (bank_id, type: cash/checking/savings, balance_mode) transactions (polimórfica o única tabla): type: expense/income/transfer/card_payment amount, date, description, category_id, account_id, card_id, project_id, client_id status: pending/confirmed/reconciled Tarjetas cards (bank_id, brand, limit, close_day, due_day) card_statements (period_start/end, total, paid, status) card_payments (transaction_id link o tabla propia) Ingresos y clientes clients income_templates (servicio/pantalla, default amount, recurrence, client default) recurring_incomes income_allocations (income_id → fund_id, percent/amount) Presupuestos budgets (month, category_id, amount, project_id nullable) budget_alerts (rules: 80%, 100%, etc.) Suscripciones subscriptions (name, amount, period, next_due, payment_source) subscription_events (paid/failed/skipped) Adjuntos attachments (owner_type/owner_id, url, provider: drive/r2, mime, size) attachment_ingest_queue (si querés procesamiento async) Reglas y conciliación rules (conditions json, actions json, priority) bank_imports (account_id, file, period) bank_import_rows (date, amount, merchant, raw json) reconciliations (row_id ↔ transaction_id, status) Alertas notifications (type, payload json, scheduled_at, sent_at, channel) 4) API / Endpoints (Laravel) GET /dashboard?month=YYYY-MM CRUD /expenses CRUD /incomes CRUD /banks, /accounts CRUD /cards, /statements, /payments CRUD /clients CRUD /subscriptions CRUD /budgets POST /attachments/upload (firma + subida) POST /imports/bank-csv POST /reconcile/auto CRUD /rules GET /reports/* (categorías, proyectos, clientes, cashflow) 5) Jobs / Cron (lo que hace que funcione “solo”) Nightly: generar alertas por presupuesto detectar “caja crítica” por proyección revisar vencimientos (suscripciones, tarjetas) On event: al crear gasto: aplicar reglas al subir adjunto: generar thumbnail / guardar metadata al importar CSV: auto-match conciliación 6) Notificaciones (canales) In-app (badge + lista) Email WhatsApp/Telegram (opcional futuro) 7) MVP recomendado (para lanzar rápido y usarlo) Fase 1 (MVP real usable): categorías cuentas bancarias gastos/ingresos con quick add presupuestos simples + alertas suscripciones adjuntos (R2/S3 primero, Drive después) dashboard con 4 gráficos Fase 2: tarjetas completas + cortes clientes + ingresos recurrentes reglas automáticas cierre mensual Fase 3: conciliación CSV proyecciones avanzadas rentabilidad por proyecto/cliente 8) Lo único que te falta definir (pero lo puedo asumir) Para implementar sin trabarte, faltan 3 decisiones: Moneda: ¿solo ₲ o multi-moneda? Modo caja: ¿querés manejar “saldo real” o “saldo estimado” hasta conciliar? Almacenamiento: ¿preferís Drive sí o sí, o aceptás R2/S3 (más simple) y Drive como espejo? Si no querés pensar: 👉 asumimos ₲, saldo estimado + conciliación, y R2/S3 primero.
para este producto (finanzas personal “anti-abandono”), yo lo haría con un stack laravel + spa bien simple, y adjuntos en S3 compatible (ideal Cloudflare R2) para que subir fotos de facturas sea instantáneo y barato.
stack recomendado (práctico y sólido)
backend (api + auth + jobs)


laravel 11 (php 8.3/8.4)


mysql 8 (o postgres si preferís; mysql va joya para esto)


redis (colas + cache + locks)


laravel queue (horizon si querés panel de colas)


laravel sanctum (auth para SPA: login + tokens/cookies)


storage de adjuntos: Cloudflare R2 (S3 compatible) + CDN


ventajas: simple, rápido, no dependés de google, y te queda prolijo para escalar




procesamiento de imágenes (opcional):


thumbnails/compresión con spatie/image o imagick


guardar metadata (mime/size/dimensiones)




frontend (desktop-first, responsive)
opción A (la más redonda para tu caso):


next.js (react)


tailwind css + shadcn/ui (ui consistente, rápida de armar)


tanstack query (cacheo/requests impecable)


react-hook-form + zod (formularios rápidos, “quick add” sin dolor)


echarts-for-react (tus gráficos ECharts directo)


opción B (si querés algo más “panel” clásico):


inertia.js + laravel (menos “api pura”, mucho más directo)
igual podés subir adjuntos y usar ECharts.


yo me quedo con opción A porque te deja el backend desacoplado y podés iterar UI sin tocar laravel tanto.

cómo resolvemos “subir factura + anotar gasto” sin fricción
flujo recomendado (2 pasos, cero trabas)


quick add gasto (monto, categoría, cuenta/tarjeta, fecha) → se crea transactions en pending


upload factura:


backend te da un presigned url S3 (POST /attachments/presign)


frontend sube la imagen directo a R2 (sin pasar por tu server)


luego POST /attachments/confirm para linkear attachments.owner_type/owner_id




esto hace que:


no se te caiga el server por subir imágenes


suba rapidísimo


sea más fácil que lo uses y no abandones



deploy (para que quede pro y estable)


cloudflare: dns + cdn (y R2 si elegís)


backend:


si querés simple: forge + digitalocean/hetzner (laravel vuela ahí)


o docker en un vps (nginx + php-fpm + supervisor para queues)




frontend: vercel (next.js perfecto)


db: mysql managed o en el mismo vps (si mvp)



extra: si querés “drive sí o sí”
podés hacerlo, pero yo lo dejaría como fase 2:


primero R2 (lo más simple)


después un job que “sincronice” a Drive si insistís (es más frágil por oauth/permisos)



si querés, te tiro el repo blueprint real (estructura de carpetas) con:


endpoints exactos (/attachments/presign, /imports/bank-csv, etc.)


policies/roles


migrations base para transactions, attachments, accounts, cards


y el layout del dashboard con 4 ECharts (cashflow, stacked categories, pie, gauge)



esto es un tentativo para construir, no es algo definitivo. proponé vos, recordá que la base de datos vamos a usar supabase y un bucket. 