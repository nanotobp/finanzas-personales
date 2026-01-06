import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or user ID for rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  return `rate_limit:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimit.get(key)

  // If no record or window expired, create new record
  if (!record || now > record.resetTime) {
    rateLimit.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }

  // Increment count
  record.count++
  rateLimit.set(key, record)

  const allowed = record.count <= MAX_REQUESTS
  const remaining = Math.max(0, MAX_REQUESTS - record.count)

  return { allowed, remaining, resetTime: record.resetTime }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimit.entries()) {
    if (now > record.resetTime) {
      rateLimit.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW)

export function withRateLimit(request: NextRequest) {
  const key = getRateLimitKey(request)
  const { allowed, remaining, resetTime } = checkRateLimit(key)

  const headers = new Headers()
  headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
  headers.set('X-RateLimit-Remaining', remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers,
      }
    )
  }

  return { allowed: true, headers }
}
