# 🚀 Quick Start - PWA Finanzas Personales

## 1️⃣ Generar Iconos (2 minutos)

### Opción A: Generador Visual (Recomendado)
```bash
# Abrí este archivo en Chrome o Firefox
open public/icons/generate-icons.html

# O en la terminal:
python -m http.server 8000  # Luego ir a http://localhost:8000/public/icons/generate-icons.html
```

1. Los iconos se generan automáticamente
2. Click en "Descargar Todos"
3. Guardá los archivos en `/public/icons/`

### Opción B: Script Node.js
```bash
npm install canvas
node scripts/generate-pwa-icons.js
```

---

## 2️⃣ Probar Localmente (1 minuto)

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en Chrome
open http://localhost:3000
```

### Verificar PWA en Chrome DevTools
1. Presioná `F12`
2. Pestaña **Application**
3. Verificá:
   - ✅ Manifest
   - ✅ Service Workers
   - ✅ Storage > Cache Storage

---

## 3️⃣ Probar en Móvil (5 minutos)

### Opción A: Usando tu red local
```bash
# Ver tu IP local
ifconfig | grep inet  # En Mac/Linux
ipconfig              # En Windows

# Iniciar dev server accesible desde red
npm run dev -- -H 0.0.0.0

# Acceder desde tu móvil a:
# http://[TU_IP_LOCAL]:3000
# Ejemplo: http://192.168.1.100:3000
```

### Opción B: Deploy rápido a Vercel
```bash
npm run build
npx vercel --prod

# Te dará una URL tipo: https://finanzas-personales.vercel.app
```

### Instalar en Android
1. Abrí la URL en **Chrome móvil**
2. Menú (⋮) > "Agregar a pantalla de inicio"
3. O esperá el banner automático de instalación

### Instalar en iOS
1. Abrí la URL en **Safari**
2. Botón Compartir (⬆)
3. "Agregar a pantalla de inicio"

---

## 4️⃣ Probar Funcionalidades (5 minutos)

### Test 1: Instalación
- ✅ Ícono aparece en home screen
- ✅ Al abrir, se ve como app nativa (sin barra del navegador)

### Test 2: Subida de Facturas
1. Abrí la app en tu móvil
2. Navegá a "Gastos"
3. Click en "Agregar Gasto"
4. Click en "Adjuntar Factura"
5. Elegí "Tomar foto" o "Seleccionar archivo"
6. ✅ La cámara se abre
7. ✅ Preview funciona
8. ✅ Subida exitosa

### Test 3: Modo Offline
1. Activá modo avión en tu móvil
2. Abrí la app instalada
3. ✅ Navegá entre páginas (deberían cargarse desde caché)
4. ✅ Si accedés a una página nueva, ves `/offline.html`
5. Desactivá modo avión
6. ✅ La app se sincroniza automáticamente

### Test 4: Atajos Rápidos
**Android:**
1. Mantené presionado el ícono de la app
2. ✅ Aparecen 3 shortcuts:
   - Agregar Gasto
   - Agregar Ingreso
   - Subir Factura

**iOS:**
1. 3D Touch o mantener presionado
2. ✅ Aparecen los shortcuts

---

## 5️⃣ Métricas con Lighthouse (2 minutos)

```bash
# En Chrome DevTools
1. F12 > Lighthouse
2. Categorías: marcar "Progressive Web App"
3. Analyze page load

# Objetivo:
# PWA Score: 90+ ✅
```

---

## 🎯 Checklist de Producción

Antes de lanzar a producción, verificá:

### Obligatorio
- [ ] Iconos PWA generados (72, 96, 128, 144, 152, 192, 384, 512)
- [ ] Service Worker registrado sin errores
- [ ] Manifest.json accesible en `/manifest.json`
- [ ] HTTPS habilitado (Vercel/Netlify lo hace automático)
- [ ] Probado en Android Chrome
- [ ] Probado en iOS Safari

### Recomendado
- [ ] Favicon.ico generado
- [ ] Screenshots para manifest (1280x720 wide, 750x1334 narrow)
- [ ] Iconos de shortcuts generados
- [ ] Lighthouse PWA score 90+
- [ ] Probado offline
- [ ] Probado instalación

### Opcional
- [ ] Background Sync implementado
- [ ] Share Target configurado
- [ ] Push Notifications configuradas
- [ ] Caché persistente configurado

---

## 📱 URLs Importantes

### Desarrollo
- **Local**: http://localhost:3000
- **Manifest**: http://localhost:3000/manifest.json
- **Service Worker**: http://localhost:3000/sw.js

### Testing Tools
- **Lighthouse**: Chrome DevTools > Lighthouse
- **Manifest Validator**: https://manifest-validator.appspot.com/
- **PWA Builder**: https://www.pwabuilder.com/

---

## 🐛 Troubleshooting Rápido

### Service Worker no se registra
```javascript
// Verificá en consola:
navigator.serviceWorker.getRegistrations()

// Si está vacío, verificá:
1. Estás en HTTPS o localhost
2. No hay errores en sw.js
3. El path es correcto (/sw.js)
```

### Instalación no aparece
```javascript
// Verificá requisitos:
1. Manifest.json válido
2. Service Worker activo
3. Iconos 192x192 y 512x512 existen
4. HTTPS (excepto localhost)

// Forzar prompt:
window.addEventListener('beforeinstallprompt', (e) => {
  e.prompt()
})
```

### Cámara no funciona
```javascript
// Verificá:
1. HTTPS habilitado
2. Permisos de cámara aceptados
3. No hay otra app usando la cámara

// Fallback a galería:
<input type="file" accept="image/*" capture="environment" />
```

### Offline no funciona
```bash
# Limpiar caché:
1. DevTools > Application > Clear Storage
2. Recargar página
3. Activar offline
4. Navegar
```

---

## 💡 Tips

### Desarrollo
```bash
# Hot reload de Service Worker
# DevTools > Application > Service Workers > Update on reload
```

### Testing en múltiples dispositivos
```bash
# Usa ngrok para exponer localhost
npx ngrok http 3000

# O usa Vercel Preview
git push origin feature/pwa
# Vercel genera URL automática
```

### Depuración
```javascript
// Ver estado del SW
navigator.serviceWorker.controller?.state

// Ver caché
caches.keys().then(console.log)

// Limpiar caché específico
caches.delete('static-v1')
```

---

## ⏱️ Tiempo Total de Setup

- Generar iconos: **2 min**
- Probar local: **1 min**
- Probar móvil: **5 min**
- Tests funcionales: **5 min**
- Lighthouse: **2 min**

**TOTAL: ~15 minutos** ⚡

---

## 🎉 Ya está!

Tu PWA está lista. Los usuarios ahora pueden:

1. **Instalar** la app en su teléfono
2. **Usar** offline cuando no tienen internet
3. **Subir facturas** desde la cámara sin abrir el navegador
4. **Acceder rápido** con shortcuts en home screen

---

## 📚 Más Info

- Documentación completa: [PWA-SETUP.md](./PWA-SETUP.md)
- Requerimientos: [REQUERIMIENTOS-EMPRENDEDOR.md](./REQUERIMIENTOS-EMPRENDEDOR.md)
- Changelog: [CAMBIOS-REALIZADOS.md](./CAMBIOS-REALIZADOS.md)

---

**¿Dudas?** Revisá [PWA-SETUP.md](./PWA-SETUP.md) > Troubleshooting
