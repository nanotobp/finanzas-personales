#!/bin/bash

# Script de diagnóstico de rendimiento
# Ejecutar: chmod +x scripts/diagnostico-rendimiento.sh && ./scripts/diagnostico-rendimiento.sh

echo "🔍 DIAGNÓSTICO DE RENDIMIENTO - Finanzas Personales"
echo "=================================================="
echo ""

# 1. Verificar tamaño del build
echo "📦 1. Tamaño del Build:"
if [ -d ".next" ]; then
  du -sh .next
  echo ""
  echo "Desglose por carpeta:"
  du -sh .next/static/chunks/* 2>/dev/null | sort -hr | head -10
else
  echo "⚠️  No hay build. Ejecuta: npm run build"
fi
echo ""

# 2. Verificar dependencias pesadas
echo "📚 2. Dependencias Pesadas (Top 10):"
if command -v npx &> /dev/null; then
  npx cost-of-modules --no-install 2>/dev/null | head -15 || echo "Instala: npm install -g cost-of-modules"
fi
echo ""

# 3. Verificar node_modules
echo "💾 3. Tamaño de node_modules:"
if [ -d "node_modules" ]; then
  du -sh node_modules
  echo "Número de paquetes: $(ls node_modules | wc -l)"
fi
echo ""

# 4. Análisis de bundle (requiere build)
echo "🎯 4. Análisis de Bundle:"
if [ -f ".next/build-manifest.json" ]; then
  echo "Build manifest encontrado ✓"
  echo "Páginas:"
  cat .next/build-manifest.json | grep -o '"pages/[^"]*"' | head -10
else
  echo "⚠️  Ejecuta: npm run build"
fi
echo ""

# 5. Verificar caché de Next.js
echo "⚡ 5. Caché de Next.js:"
if [ -d ".next/cache" ]; then
  du -sh .next/cache
  echo "Última modificación:"
  ls -lt .next/cache | head -5
fi
echo ""

# 6. Métricas de desarrollo
echo "🚀 6. Servidor de Desarrollo:"
if pgrep -f "next dev" > /dev/null; then
  echo "✓ Servidor corriendo en http://localhost:3001"
  echo "Memoria del proceso:"
  ps aux | grep "next dev" | grep -v grep | awk '{print $6/1024 " MB"}'
else
  echo "✗ Servidor no está corriendo"
fi
echo ""

# 7. Sugerencias de optimización
echo "💡 7. Sugerencias de Optimización:"
echo ""
echo "Si la app está lenta, prueba:"
echo "  1. npm run build && npm start (producción es más rápida)"
echo "  2. Limpiar caché: rm -rf .next node_modules && npm install"
echo "  3. Verificar DevTools > Network para queries lentas"
echo "  4. Verificar Supabase Dashboard > Performance"
echo "  5. Usar React DevTools Profiler"
echo ""

# 8. Comandos útiles
echo "🛠️  8. Comandos Útiles:"
echo ""
echo "  Analizar bundle size:"
echo "    npm run build"
echo "    npx @next/bundle-analyzer"
echo ""
echo "  Limpiar completamente:"
echo "    rm -rf .next node_modules package-lock.json"
echo "    npm install"
echo ""
echo "  Medir tiempo de build:"
echo "    time npm run build"
echo ""
echo "  Ver logs del servidor:"
echo "    tail -f /tmp/dev-server.log"
echo ""

echo "=================================================="
echo "✅ Diagnóstico completado"
