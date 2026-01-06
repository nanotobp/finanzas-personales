-- Crear bucket para facturas/recibos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad para el bucket de receipts
-- Los usuarios pueden subir sus propias facturas
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden ver sus propias facturas
CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden actualizar sus propias facturas
CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden eliminar sus propias facturas
CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Agregar columna receipt_url a transactions si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE transactions ADD COLUMN receipt_url TEXT;
  END IF;
END $$;

-- Comentario descriptivo
COMMENT ON COLUMN transactions.receipt_url IS 'URL pública de la factura/recibo almacenada en Supabase Storage';
