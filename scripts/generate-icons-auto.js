const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generando iconos PWA con gráfico de barras azul...\n');

// Función para dibujar el ícono con gráfico de barras
function drawChartIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fondo con gradiente azul
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6'); // Blue-500
  gradient.addColorStop(1, '#1d4ed8'); // Blue-700
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Círculo decorativo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2.5, 0, Math.PI * 2);
  ctx.fill();

  // Gráfico de barras
  const barWidth = size * 0.12;
  const spacing = size * 0.05;
  const startX = size * 0.2;
  const heights = [0.4, 0.65, 0.5, 0.75, 0.55];

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  heights.forEach((height, i) => {
    const x = startX + (barWidth + spacing) * i;
    const barHeight = size * height;
    const y = size * 0.8 - barHeight;

    // Barra con bordes redondeados
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, size * 0.02);
    ctx.fill();
  });

  return canvas;
}

// Generar todos los tamaños
sizes.forEach(size => {
  const canvas = drawChartIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  console.log(`✓ Generado: ${filename}`);
});

// Generar favicon (32x32)
const faviconCanvas = drawChartIcon(32);
const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), faviconBuffer);
console.log('✓ Generado: favicon.ico');

// Generar iconos de shortcuts
const shortcuts = [
  { name: 'shortcut-expense', color: '#ef4444', symbol: '-', bg: '#fee2e2' },
  { name: 'shortcut-income', color: '#22c55e', symbol: '+', bg: '#dcfce7' },
  { name: 'shortcut-upload', color: '#3b82f6', symbol: '📷', bg: '#dbeafe' }
];

shortcuts.forEach(({ name, color, symbol, bg }) => {
  const canvas = createCanvas(96, 96);
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 96, 96);

  // Círculo blanco
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(48, 48, 30, 0, Math.PI * 2);
  ctx.fill();

  // Símbolo
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 48, 48);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `${name}.png`), buffer);
  console.log(`✓ Generado: ${name}.png`);
});

// Generar badge para notificaciones
const badgeCanvas = createCanvas(72, 72);
const badgeCtx = badgeCanvas.getContext('2d');
badgeCtx.fillStyle = '#3b82f6';
badgeCtx.fillRect(0, 0, 72, 72);
badgeCtx.fillStyle = 'white';
badgeCtx.font = 'bold 36px Arial';
badgeCtx.textAlign = 'center';
badgeCtx.textBaseline = 'middle';
badgeCtx.fillText('$', 36, 36);
const badgeBuffer = badgeCanvas.toBuffer('image/png');
fs.writeFileSync(path.join(outputDir, 'badge-72x72.png'), badgeBuffer);
console.log('✓ Generado: badge-72x72.png');

console.log('\n✅ Todos los iconos PWA fueron generados exitosamente!');
console.log(`📁 Ubicación: ${outputDir}`);
