#!/bin/bash

# Script para ejecutar migración de funcionalidades avanzadas en Supabase
# Uso: ./run-migration.sh

set -e

echo "🚀 Iniciando migración de funcionalidades avanzadas a Supabase..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que existe el archivo .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo .env.local${NC}"
    echo "Por favor, crea el archivo .env.local con tus credenciales de Supabase"
    exit 1
fi

# Cargar variables de entorno
source .env.local

# Verificar que existen las variables necesarias
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Faltan variables de entorno${NC}"
    echo "Asegúrate de que .env.local contenga:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo -e "${BLUE}📍 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL${NC}"
echo ""

# Archivo de migración
MIGRATION_FILE="supabase/migrations/003_advanced_features.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo de migración${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Ejecutando migración: $MIGRATION_FILE${NC}"
echo ""

# Ejecutar migración usando la API de Supabase
# Nota: Necesitarás ejecutar esto manualmente en el SQL Editor de Supabase
echo -e "${GREEN}✅ Pasos para ejecutar la migración:${NC}"
echo ""
echo "1. Abre Supabase Dashboard: https://app.supabase.com"
echo "2. Selecciona tu proyecto"
echo "3. Ve a 'SQL Editor' en el menú lateral"
echo "4. Crea un nuevo query"
echo "5. Copia y pega el contenido de: $MIGRATION_FILE"
echo "6. Ejecuta el query"
echo ""
echo -e "${BLUE}💡 Tip: También puedes usar la Supabase CLI:${NC}"
echo "   npx supabase db push"
echo ""

# Alternativamente, si tienes psql instalado:
echo -e "${BLUE}🔧 O ejecuta directamente con psql:${NC}"
echo ""
echo "Necesitarás:"
echo "  1. La connection string de tu proyecto Supabase"
echo "  2. PostgreSQL client (psql) instalado"
echo ""
echo "Comando:"
echo "  psql 'postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres' -f $MIGRATION_FILE"
echo ""

# Crear archivo temporal con instrucciones
cat > /tmp/supabase-migration-instructions.txt << EOF
===========================================
INSTRUCCIONES DE MIGRACIÓN SUPABASE
===========================================

Archivo de migración: $MIGRATION_FILE

OPCIÓN 1: Supabase Dashboard (Recomendado)
-------------------------------------------
1. Abre: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a SQL Editor
4. Copia el contenido de: $MIGRATION_FILE
5. Pega y ejecuta

OPCIÓN 2: Supabase CLI
----------------------
Si tienes Supabase CLI instalado:
  cd $(pwd)
  npx supabase db push

OPCIÓN 3: psql directo
----------------------
Si tienes psql instalado y la connection string:
  psql 'tu-connection-string' -f $MIGRATION_FILE

Connection string está en:
  Settings > Database > Connection string

===========================================
VERIFICACIÓN POST-MIGRACIÓN
===========================================

Ejecuta estas queries para verificar:

-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'achievements',
  'user_achievements', 
  'user_points',
  'financial_habits',
  'habit_completions',
  'notifications'
);

-- Ver funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'update_user_streak',
  'update_goal_progress',
  'create_auto_notification',
  'generate_monthly_report'
);

===========================================
EOF

echo -e "${GREEN}✅ Instrucciones guardadas en: /tmp/supabase-migration-instructions.txt${NC}"
echo ""
echo -e "${BLUE}📖 Para ver las instrucciones completas:${NC}"
echo "   cat /tmp/supabase-migration-instructions.txt"
echo ""
