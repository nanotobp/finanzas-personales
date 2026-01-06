'use client'

import { useState, useEffect } from 'react'
import { Camera, Upload, X, Check, Loader2, Image as ImageIcon, FileImage, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCamera } from '@/hooks/use-camera'
import { useToast } from '@/hooks/use-toast'

interface ReceiptUploadMobileProps {
  onUpload?: (file: File) => void | Promise<void>
  onCancel?: () => void
  autoOpen?: boolean
}

export function ReceiptUploadMobile({
  onUpload,
  onCancel,
  autoOpen = false,
}: ReceiptUploadMobileProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const {
    isCapturing,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    captureFromGallery,
    hasCamera,
  } = useCamera({
    onCapture: (file) => {
      setSelectedFile(file)
      stopCamera()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo acceder a la cámara',
        variant: 'destructive',
      })
      console.error(error)
    },
  })

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [selectedFile])

  useEffect(() => {
    if (autoOpen && hasCamera) {
      handleCameraCapture()
    }
  }, [autoOpen, hasCamera])

  const handleCameraCapture = async () => {
    try {
      await startCamera()
    } catch (error) {
      console.error('Error al iniciar cámara:', error)
    }
  }

  const handleGallerySelect = async () => {
    const file = await captureFromGallery()
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleTakePhoto = async () => {
    try {
      await capturePhoto()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo capturar la foto',
        variant: 'destructive',
      })
      console.error(error)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      await onUpload?.(selectedFile)
      setIsSuccess(true)

      toast({
        title: 'Factura subida',
        description: 'La factura se guardó correctamente',
      })

      // Limpiar después de 2 segundos
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setIsSuccess(false)
        onCancel?.()
      }, 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo subir la factura. Se guardará cuando tengas conexión.',
        variant: 'destructive',
      })
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    if (isCapturing) {
      stopCamera()
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    onCancel?.()
  }

  const handleRetake = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    handleCameraCapture()
  }

  // Vista de cámara activa
  if (isCapturing) {
    return (
      <Card className="fixed inset-0 z-50 bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              className="text-white h-12 w-12"
              onClick={handleCancel}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-white hover:bg-white/90"
              onClick={handleTakePhoto}
            >
              <Camera className="h-8 w-8 text-black" />
            </Button>
            <div className="w-12" /> {/* Espaciador */}
          </div>
        </div>
        <div className="absolute top-6 left-0 right-0 text-center">
          <p className="text-white text-sm px-4">
            Centrá la factura en el recuadro y tocá el botón para capturar
          </p>
        </div>
      </Card>
    )
  }

  // Vista de preview y upload
  if (previewUrl) {
    return (
      <Card className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-2xl mx-auto">
            {selectedFile?.type === 'application/pdf' ? (
              <div className="bg-muted rounded-lg p-8 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>

        <div className="border-t bg-background p-4 space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRetake}
              disabled={isUploading || isSuccess}
            >
              Tomar otra
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={isUploading || isSuccess}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Listo
                </>
              ) : (
                <>
                  <FileImage className="mr-2 h-4 w-4" />
                  Subir factura
                </>
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    )
  }

  // Vista de opciones iniciales
  return (
    <Card className="p-6 space-y-4">
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">Subir factura</h3>
        <p className="text-sm text-muted-foreground">
          Elegí cómo querés agregar la factura
        </p>
      </div>

      <div className="space-y-3">
        {hasCamera && (
          <Button
            className="w-full h-auto py-4"
            onClick={handleCameraCapture}
          >
            <Camera className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Tomar foto</div>
              <div className="text-xs opacity-80">Usar la cámara del dispositivo</div>
            </div>
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full h-auto py-4"
          onClick={handleGallerySelect}
        >
          <Upload className="mr-3 h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">Seleccionar archivo</div>
            <div className="text-xs opacity-80">Desde galería o archivos</div>
          </div>
        </Button>
      </div>

      {onCancel && (
        <Button variant="ghost" className="w-full" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </Card>
  )
}
