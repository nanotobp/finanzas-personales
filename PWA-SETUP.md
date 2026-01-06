# Configuración PWA - Finanzas Personales

Este proyecto ahora es una Progressive Web App (PWA) completa que permite trabajar offline y subir facturas desde dispositivos móviles.

## Características PWA Implementadas

### 1. Instalación en dispositivos
- ✅ Botón de instalación automático después de 30 segundos
- ✅ Manifest.json configurado con iconos y shortcuts
- ✅ Compatible con Android, iOS y Desktop

### 2. Funcionalidad Offline
- ✅ Service Worker con estrategias de caché inteligentes
- ✅ Página offline personalizada
- ✅ Sincronización automática cuando vuelve la conexión
- ✅ Cache de imágenes, estilos y scripts

### 3. Subida de facturas desde móvil
- ✅ Captura desde cámara (cámara trasera optimizada)
- ✅ Selección desde galería
- ✅ Preview antes de subir
- ✅ Compresión automática de imágenes
- ✅ Soporte para PDF y imágenes

### 4. Atajos rápidos (Shortcuts)
- Agregar Gasto
- Agregar Ingreso
- Subir Factura

## Generar Iconos PWA

Para generar los iconos necesarios para la PWA:

1. Abrí el archivo `/public/icons/generate-icons.html` en tu navegador
2. Los iconos se generarán automáticamente
3. Hacé clic en "Descargar Todos" para guardarlos
4. Los iconos quedarán en la carpeta `/public/icons/`

Tamaños generados:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## Cómo probar la PWA

### En Desktop (Chrome/Edge)
1. Ejecutá `npm run dev` o `npm run build && npm start`
2. Abrí https://localhost:3000
3. Buscá el ícono de instalación en la barra de direcciones
4. Hacé clic en "Instalar"

### En Android
1. Desplegá el proyecto en un servidor HTTPS (Vercel, Netlify, etc.)
2. Abrí la URL en Chrome móvil
3. Aparecerá un banner de instalación o menú > "Agregar a pantalla de inicio"
4. La app se instalará como una app nativa

### En iOS
1. Desplegá el proyecto en un servidor HTTPS
2. Abrí la URL en Safari
3. Tocá el botón de compartir
4. Seleccioná "Agregar a pantalla de inicio"

## Estructura de archivos PWA

```
/public
  /icons/              # Iconos PWA
  /screenshots/        # Screenshots para tiendas de apps
  manifest.json        # Manifest PWA
  sw.js               # Service Worker
  offline.html        # Página offline

/components
  pwa-install-prompt.tsx   # Prompt de instalación
  pwa-provider.tsx         # Provider con registro de SW
  receipt-upload-mobile.tsx # Componente de subida mobile

/hooks
  use-camera.ts       # Hook para acceder a la cámara
```

## Configuración del Service Worker

El Service Worker implementa 3 estrategias de caché:

1. **Network First** (HTML y APIs)
   - Intenta primero la red
   - Si falla, usa caché
   - Ideal para contenido dinámico

2. **Cache First** (Imágenes y assets estáticos)
   - Usa caché si está disponible
   - Si no, descarga de la red
   - Ideal para recursos que no cambian

3. **Stale While Revalidate** (futura implementación)
   - Sirve desde caché mientras actualiza en segundo plano

## Sincronización en segundo plano

La PWA soporta Background Sync para:
- Subir facturas capturadas offline
- Sincronizar gastos/ingresos pendientes
- Actualizar datos cuando vuelve la conexión

Para activar:
```javascript
// El service worker escucha el evento 'sync'
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-receipts')
})
```

## Notificaciones Push (futuro)

El Service Worker está preparado para recibir notificaciones push:
- Alertas de presupuesto excedido
- Recordatorios de facturas pendientes
- Vencimientos de suscripciones

## Compatibilidad

| Funcionalidad | Chrome | Safari | Firefox | Edge |
|--------------|--------|--------|---------|------|
| Instalación | ✅ | ✅ | ✅ | ✅ |
| Offline | ✅ | ✅ | ✅ | ✅ |
| Cámara | ✅ | ✅* | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Push Notifications | ✅ | ✅** | ✅ | ✅ |

*Safari iOS requiere permisos de cámara
**Safari iOS 16.4+ soporta Web Push

## Deployment

### Requisitos para PWA
- ✅ HTTPS obligatorio (excepto localhost)
- ✅ Service Worker registrado
- ✅ Manifest.json válido
- ✅ Al menos un ícono 192x192 y uno 512x512

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

## Métricas PWA

Podés verificar la calidad de tu PWA con Lighthouse:

1. Abrí DevTools > Lighthouse
2. Seleccioná "Progressive Web App"
3. Ejecutá el análisis

Objetivo: 90+ en todas las categorías.

## Troubleshooting

### El Service Worker no se registra
- Verificá que estés en HTTPS o localhost
- Revisá la consola del navegador
- Limpiá caché y recargá

### La instalación no aparece
- Esperá 30 segundos (o ajustá el delay en pwa-install-prompt.tsx)
- Verificá que manifest.json sea accesible
- Confirmá que los iconos existan

### La cámara no funciona
- Verificá permisos del navegador
- Asegurate de estar en HTTPS
- Probá con `captureFromGallery()` como fallback

### Offline no funciona
- Verificá que el Service Worker esté activo (DevTools > Application)
- Confirmá que los recursos estén en caché
- Revisá la estrategia de caché en sw.js

## Próximas mejoras

- [ ] IndexedDB para almacenar gastos offline
- [ ] Compresión automática de imágenes antes de subir
- [ ] OCR para leer datos de facturas automáticamente
- [ ] Sincronización selectiva de datos
- [ ] Modo offline-first completo

## Recursos

- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
