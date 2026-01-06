#!/bin/bash

echo "🔄 Aplicando correcciones a la base de datos..."
echo ""
echo "📋 Este script corregirá:"
echo "   1. Políticas RLS para la tabla invoices"
echo "   2. Creará el cliente 'Varios' por defecto"
echo ""

# Leer las variables de entorno
source .env.local

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Variables de entorno no encontradas"
  echo "   Asegúrate de que .env.local contiene:"
  echo "   - NEXT_PUBLIC_SUPABASE_URL"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# Extraer el project ref de la URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

echo "🌐 Conectando a Supabase..."
echo "   Proyecto: $PROJECT_REF"
echo ""

# Leer el archivo SQL
SQL_FILE="supabase/fix-invoices-rls.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: No se encontró el archivo $SQL_FILE"
  exit 1
fi

echo "📝 Ejecutando SQL desde: $SQL_FILE"
echo ""
echo "⚠️  IMPORTANTE: Este script requiere acceso directo a la base de datos."
echo "   Si falla, debes ejecutar el SQL manualmente:"
echo ""
echo "   1. Abre https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "   2. Copia y pega el contenido de: $SQL_FILE"
echo "   3. Haz clic en 'Run'"
echo ""
echo "Presiona Enter para continuar o Ctrl+C para cancelar..."
read

# Intentar ejecutar con psql si está disponible
if command -v psql &> /dev/null; then
  echo "🔧 Usando psql para ejecutar la migración..."
  
  # Construir la cadena de conexión
  DB_URL="${NEXT_PUBLIC_SUPABASE_URL/https:\/\//}"
  
  echo "⚠️  Nota: psql detectado pero se necesita la cadena de conexión completa."
  echo "   Por favor, ejecuta el SQL manualmente en el panel de Supabase."
else
  echo "ℹ️  psql no está instalado."
  echo "   Por favor, ejecuta el SQL manualmente en el panel de Supabase."
fi

echo ""
echo "📄 Contenido del archivo SQL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$SQL_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Copia el contenido de arriba y ejecútalo en:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
