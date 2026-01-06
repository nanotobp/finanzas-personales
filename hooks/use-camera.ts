'use client'

import { useState, useRef, useCallback } from 'react'

interface UseCameraOptions {
  onCapture?: (file: File) => void
  onError?: (error: Error) => void
}

export function useCamera({ onCapture, onError }: UseCameraOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true)

      // Solicitar acceso a la cámara
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      setStream(mediaStream)

      // Asignar stream al video
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setIsCapturing(false)
      onError?.(error as Error)
    }
  }, [onError])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !stream) {
      throw new Error('Cámara no inicializada')
    }

    // Crear canvas para capturar el frame
    const canvas = document.createElement('canvas')
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('No se pudo obtener el contexto del canvas')
    }

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir canvas a blob
    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error generando la imagen'))
            return
          }

          // Crear archivo con timestamp
          const timestamp = Date.now()
          const file = new File([blob], `factura-${timestamp}.jpg`, {
            type: 'image/jpeg',
            lastModified: timestamp,
          })

          onCapture?.(file)
          resolve(file)
        },
        'image/jpeg',
        0.92 // Calidad de compresión
      )
    })
  }, [stream, onCapture])

  const captureFromGallery = useCallback(async (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,application/pdf'
      input.capture = 'environment' // Esto sugiere usar la cámara si está disponible

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        if (file) {
          onCapture?.(file)
          resolve(file)
        } else {
          resolve(null)
        }
      }

      input.oncancel = () => resolve(null)
      input.click()
    })
  }, [onCapture])

  return {
    isCapturing,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    captureFromGallery,
    hasCamera: Boolean(navigator.mediaDevices?.getUserMedia),
  }
}
