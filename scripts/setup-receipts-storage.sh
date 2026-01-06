#!/bin/bash

# Script para configurar el storage de receipts en Supabase
# Este script debe ejecutarse con acceso a psql o desde el SQL Editor de Supabase

echo "📋 Configuración de Storage para Receipts"
echo "=========================================="
echo ""
echo "Por favor, ejecuta el siguiente SQL en el SQL Editor de Supabase:"
echo ""
echo "Dashboard > SQL Editor > New Query"
echo ""
cat ../supabase/receipts-storage.sql
echo ""
echo "=========================================="
echo ""
echo "O ejecuta este comando si tienes acceso directo a PostgreSQL:"
echo ""
echo "psql -h db.juygffhwqpjpmwgajcwj.supabase.co -U postgres -d postgres < supabase/receipts-storage.sql"
echo ""
