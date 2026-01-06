/**
 * Script para generar iconos PWA
 * Ejecutar con: node scripts/generate-pwa-icons.js
 *
 * Requiere: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Si no tenés sharp instalado, usá este método alternativo con Canvas
// npm install canvas

async function generateIconsWithCanvas() {
  try {
    const { createCanvas } = require('canvas');

    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    const outputDir = path.join(__dirname, '../public/icons');

    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Generando iconos PWA...\n');

    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Gradiente verde
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#22c55e');
      gradient.addColorStop(1, '#16a34a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Círculo blanco semi-transparente
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
      ctx.fill();

      // Símbolo $
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size/2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', size/2, size/2);

      // Guardar
      const buffer = canvas.toBuffer('image/png');
      const filename = `icon-${size}x${size}.png`;
      fs.writeFileSync(path.join(outputDir, filename), buffer);
      console.log(`✓ Generado: ${filename}`);
    }

    // Generar favicon.ico (simplificado - solo 32x32)
    const canvas32 = createCanvas(32, 32);
    const ctx32 = canvas32.getContext('2d');

    const gradient32 = ctx32.createLinearGradient(0, 0, 32, 32);
    gradient32.addColorStop(0, '#22c55e');
    gradient32.addColorStop(1, '#16a34a');
    ctx32.fillStyle = gradient32;
    ctx32.fillRect(0, 0, 32, 32);

    ctx32.fillStyle = 'white';
    ctx32.font = 'bold 16px Arial';
    ctx32.textAlign = 'center';
    ctx32.textBaseline = 'middle';
    ctx32.fillText('$', 16, 16);

    const faviconBuffer = canvas32.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), faviconBuffer);
    console.log('✓ Generado: favicon.ico');

    // Generar iconos para shortcuts
    const shortcutIcons = [
      { name: 'shortcut-expense', text: '-', color: '#ef4444' },
      { name: 'shortcut-income', text: '+', color: '#22c55e' },
      { name: 'shortcut-upload', text: '📷', color: '#3b82f6' },
    ];

    for (const icon of shortcutIcons) {
      const canvas96 = createCanvas(96, 96);
      const ctx96 = canvas96.getContext('2d');

      ctx96.fillStyle = icon.color;
      ctx96.fillRect(0, 0, 96, 96);

      ctx96.fillStyle = 'white';
      ctx96.font = 'bold 48px Arial';
      ctx96.textAlign = 'center';
      ctx96.textBaseline = 'middle';
      ctx96.fillText(icon.text, 48, 48);

      const iconBuffer = canvas96.toBuffer('image/png');
      fs.writeFileSync(path.join(outputDir, `${icon.name}.png`), iconBuffer);
      console.log(`✓ Generado: ${icon.name}.png`);
    }

    console.log('\n✅ Todos los iconos PWA fueron generados exitosamente!');
    console.log(`📁 Ubicación: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error generando iconos:', error.message);
    console.log('\n💡 Instalá canvas con: npm install canvas');
    console.log('O abrí public/icons/generate-icons.html en tu navegador');
  }
}

// Ejecutar
generateIconsWithCanvas();
