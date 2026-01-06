import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { withRateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = withRateLimit(request)
    
    if ('status' in rateLimitResult) {
      // Rate limit exceeded
      return rateLimitResult
    }
    
    // Continue with session update and add rate limit headers
    const response = await updateSession(request)
    
    // Add rate limit headers to response
    rateLimitResult.headers.forEach((value, key) => {
      response.headers.set(key, value)
    })
    
    return response
  }

  // Actualizar sesión de Supabase
  const response = await updateSession(request)

  // Rutas públicas
  const publicRoutes = ['/login', '/signup', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    return response
  }

  // Para rutas protegidas, verificar autenticación se hace en el layout
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
