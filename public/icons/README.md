# Iconos PWA

## Generar Iconos

Ejecutá cualquiera de estos métodos:

### Método 1: Generador HTML (Visual)
1. Abrí `generate-icons.html` en tu navegador
2. Click en "Descargar Todos"
3. Los archivos se descargan automáticamente

### Método 2: Script Node.js
```bash
npm install canvas
node ../scripts/generate-pwa-icons.js
```

## Tamaños Requeridos

- 72x72 (Android Chrome)
- 96x96 (Android Chrome)
- 128x128 (Android Chrome)
- 144x144 (Android Chrome)
- 152x152 (iOS Safari)
- 192x192 (Android Chrome - mínimo)
- 384x384 (Android Chrome)
- 512x512 (Android Chrome - splash screen)

## Shortcuts

- shortcut-expense.png (96x96)
- shortcut-income.png (96x96)
- shortcut-upload.png (96x96)

## Notas

- Todos los iconos deben ser PNG
- Fondo no transparente para mejor compatibilidad
- Purpose: "any maskable" para adaptarse a diferentes formas
