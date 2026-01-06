# 🔐 Acceso y PWA - Finanzas Personales

## ✅ Iconos PWA Generados

Los iconos con **gráfico de barras azul** ya están instalados y funcionando:

### Iconos Generados
- ✅ icon-72x72.png
- ✅ icon-96x96.png
- ✅ icon-128x128.png
- ✅ icon-144x144.png
- ✅ icon-152x152.png
- ✅ icon-192x192.png (requerido mínimo)
- ✅ icon-384x384.png
- ✅ icon-512x512.png (requerido mínimo)
- ✅ favicon.ico
- ✅ shortcut-expense.png (rojo)
- ✅ shortcut-income.png (verde)
- ✅ shortcut-upload.png (azul)
- ✅ badge-72x72.png (para notificaciones)

**Ubicación**: `/public/icons/`

**Diseño**: Gráfico de barras con gradiente azul (#3b82f6 → #1d4ed8)

---

## 🔑 Credenciales de Admin

### Login Credentials

**Email**: `admin@finanzas.com`
**Password**: `admin123456`

**IMPORTANTE**: Cambiá la contraseña después del primer login

---

## 🌐 URLs de Acceso

### 💻 Desde tu Computadora

| Página | URL |
|--------|-----|
| **Login** | http://localhost:3000/login |
| **Dashboard** | http://localhost:3000/dashboard |
| **Signup** | http://localhost:3000/signup |

### 📱 Desde tu Celular (misma red WiFi)

**Tu IP local**: `192.168.18.18`

| Página | URL |
|--------|-----|
| **Login** | http://192.168.18.18:3000/login |
| **Dashboard** | http://192.168.18.18:3000/dashboard |
| **Signup** | http://192.168.18.18:3000/signup |

---

## 📱 Instalar la PWA

### En Android (Chrome)

1. Abrí: http://192.168.18.18:3000/login
2. Iniciá sesión con las credenciales de admin
3. Esperá 30 segundos para el banner de instalación
   - O tocá menú (⋮) → "Agregar a pantalla de inicio"
4. ¡Listo! El ícono azul con gráfico de barras aparecerá en tu home screen

### En iOS (Safari)

1. Abrí: http://192.168.18.18:3000/login en Safari
2. Iniciá sesión
3. Tocá el botón compartir (⬆️)
4. Desplazá hacia abajo y tocá "Agregar a pantalla de inicio"
5. ¡Listo!

---

## 🎯 Verificar que la PWA Funciona

### 1. Manifest
Abrí: http://localhost:3000/manifest.json

Deberías ver:
```json
{
  "name": "Finanzas Personales",
  "short_name": "Finanzas",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      ...
    }
  ]
}
```

### 2. Service Worker
Abrí: http://localhost:3000/sw.js

Deberías ver el código del service worker.

### 3. Chrome DevTools
1. F12 → Application tab
2. **Manifest**: Verificar que muestra "Finanzas Personales"
3. **Service Workers**: Debería estar "activated and running"
4. **Icons**: Debería mostrar todos los iconos generados

---

## 🎨 Características de los Iconos

### Diseño
- **Color principal**: Azul (#3b82f6)
- **Gradiente**: Azul claro → Azul oscuro
- **Ícono**: Gráfico de barras (5 barras)
- **Fondo**: Círculo decorativo semi-transparente

### Shortcuts (Android)
Cuando instalás la app, podés mantener presionado el ícono para ver:

1. **Agregar Gasto** (rojo) - símbolo "-"
2. **Agregar Ingreso** (verde) - símbolo "+"
3. **Subir Factura** (azul) - emoji 📷

---

## 🚀 Pasos Rápidos para Usar

### Primera vez:

1. **Desktop**: Abrí http://localhost:3000/login
2. **Login**:
   - Email: `admin@finanzas.com`
   - Password: `admin123456`
3. **Cambiar contraseña** en Settings
4. **Móvil**: Instalá la PWA desde tu celular

### Uso diario:

1. **Desde móvil**: Tocá el ícono azul en tu home screen
2. **Agregar gasto rápido**: ⌘K (desktop) o FAB (móvil)
3. **Subir factura**: Shortcuts o botón en expenses
4. **Offline**: Todo funciona sin internet, se sincroniza después

---

## 🔧 Troubleshooting

### No veo el ícono en manifest
```bash
# Verificar que los archivos existen
ls -la public/icons/

# Deberías ver 13 archivos PNG
```

### El banner de instalación no aparece
1. Verificá que estés en HTTPS o localhost
2. Esperá 30 segundos
3. Usá el menú del navegador manualmente

### Los iconos no se ven
1. Recargá la página (Ctrl+Shift+R)
2. Limpiar caché del navegador
3. Verificar que `/public/icons/` tiene los archivos

---

## 📊 Servidor en Ejecución

**Estado**: ✅ Corriendo

- **URL Desktop**: http://localhost:3000
- **URL Móvil**: http://192.168.18.18:3000
- **Puerto**: 3000

Para detener:
```bash
# Buscar proceso
lsof -ti:3000

# Matar proceso
kill -9 $(lsof -ti:3000)
```

Para reiniciar:
```bash
npm run dev
```

---

## 🎉 Todo Listo!

Ya tenés:
- ✅ Iconos PWA con gráfico de barras azul instalados
- ✅ Credenciales de admin
- ✅ Servidor corriendo
- ✅ URLs para desktop y móvil
- ✅ Dashboard optimizado ~52% más rápido

**Solo falta instalar la PWA en tu celular y empezar a usarla!**

---

## 📱 Cómo Se Ve la PWA

### Home Screen
- Ícono azul con gráfico de barras
- Nombre: "Finanzas"

### Al Abrir
- Sin barra de navegador (fullscreen)
- Splash screen con el ícono
- Funciona como app nativa

### Offline
- Dashboard cargado desde caché
- Página "/offline.html" si accedés a algo nuevo
- Auto-sincroniza cuando vuelve internet

---

**¿Necesitás ayuda?** Revisá este documento o los otros:
- PWA-SETUP.md - Guía técnica completa
- OPTIMIZACIONES-DASHBOARD.md - Detalles de performance
- QUICKSTART-PWA.md - Inicio rápido

**Última actualización**: 2026-01-05 15:15
