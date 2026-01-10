#!/bin/bash

# 🧹 Script de Limpieza del Proyecto
# Elimina archivos innecesarios de depuración y desarrollo

echo "🧹 Iniciando limpieza del proyecto..."
echo ""

# Crear backup antes de eliminar
BACKUP_DIR="./backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/scripts"
mkdir -p "$BACKUP_DIR/supabase"

echo "📦 Creando backup en $BACKUP_DIR..."

# Backup de scripts a eliminar
CLEANUP_SCRIPTS=(
  "check-all-invoices-status.js"
  "check-clients.js"
  "check-invoice-columns.js"
  "check-invoices-month.js"
  "check-invoices-paid-dates.js"
  "check-invoices-rls.js"
  "check-paid-dates.js"
  "check-paid-invoices.js"
  "check-tables.js"
  "diagnose-403.js"
  "diagnostico-rendimiento.sh"
  "simple-diagnose.js"
  "apply-fix-invoices-rls.js"
  "apply-invoices-fix.sh"
  "fix-invoices-rls.js"
  "fix-invoices-user-id.js"
  "fix-paid-dates.js"
  "show-fix-instructions.sh"
  "show-invoices-schema.js"
)

for script in "${CLEANUP_SCRIPTS[@]}"; do
  if [ -f "scripts/$script" ]; then
    cp "scripts/$script" "$BACKUP_DIR/scripts/"
    echo "  ✓ Respaldado: scripts/$script"
  fi
done

# Backup de archivos SQL a eliminar
CLEANUP_SQL=(
  "fix-invoices-rls.sql"
  "fix-triggers.sql"
  "diagnostico.sql"
)

for sql in "${CLEANUP_SQL[@]}"; do
  if [ -f "supabase/$sql" ]; then
    cp "supabase/$sql" "$BACKUP_DIR/supabase/"
    echo "  ✓ Respaldado: supabase/$sql"
  fi
done

echo ""
echo "🗑️  Eliminando scripts de depuración..."

# Eliminar scripts
for script in "${CLEANUP_SCRIPTS[@]}"; do
  if [ -f "scripts/$script" ]; then
    rm "scripts/$script"
    echo "  ✓ Eliminado: scripts/$script"
  fi
done

# Eliminar archivos SQL
for sql in "${CLEANUP_SQL[@]}"; do
  if [ -f "supabase/$sql" ]; then
    rm "supabase/$sql"
    echo "  ✓ Eliminado: supabase/$sql"
  fi
done

# Eliminar .DS_Store
echo ""
echo "🧹 Limpiando archivos de sistema..."
find . -name ".DS_Store" -type f -delete
echo "  ✓ Eliminados archivos .DS_Store"

# Limpiar carpeta temporal
if [ -d "supabase/.temp" ]; then
  rm -rf "supabase/.temp"
  echo "  ✓ Eliminada carpeta supabase/.temp"
fi

# Mover tests fuera de scripts/
echo ""
echo "📁 Reorganizando archivos de testing..."
TEST_SCRIPTS=(
  "test-income-query.js"
  "test-invoice-insert.js"
  "test-invoices-query.js"
  "test-real-insert.js"
)

for test in "${TEST_SCRIPTS[@]}"; do
  if [ -f "scripts/$test" ]; then
    mv "scripts/$test" "tests/$test"
    echo "  ✓ Movido: scripts/$test → tests/$test"
  fi
done

echo ""
echo "✅ Limpieza completada!"
echo ""
echo "📊 Resumen:"
echo "  - ${#CLEANUP_SCRIPTS[@]} scripts eliminados"
echo "  - ${#CLEANUP_SQL[@]} archivos SQL eliminados"
echo "  - ${#TEST_SCRIPTS[@]} tests reorganizados"
echo "  - Archivos de sistema limpiados"
echo ""
echo "💾 Backup guardado en: $BACKUP_DIR"
echo ""
echo "⚠️  Para aplicar cambios al repositorio, ejecuta:"
echo "    git add -A"
echo "    git commit -m 'chore: cleanup unnecessary debug scripts and files'"
echo ""
