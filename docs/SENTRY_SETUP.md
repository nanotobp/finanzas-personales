# Sentry Error Tracking Setup

## Instalación

```bash
npm install @sentry/nextjs
```

## Configuración

### 1. Inicializar Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

### 2. Variables de entorno

Agregar a `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. Archivos de configuración

El wizard creará automáticamente:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` (actualizado)

### 4. Configuración personalizada

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ajustar el rate de muestreo según el plan
  tracesSampleRate: 1.0,
  
  // Capturar Replay solo en errores (ahorra cuota)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Filtrar errores conocidos
  beforeSend(event, hint) {
    // Ignorar errores de extensiones del navegador
    if (event.exception?.values?.[0]?.value?.includes('chrome-extension')) {
      return null
    }
    return event
  },
  
  // Integración con Session Replay
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  environment: process.env.NODE_ENV,
})
```

### 5. Uso en Error Boundaries

```typescript
// components/error-boundary.tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Enviar a Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  })
}
```

### 6. Captura manual de errores

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // código peligroso
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'payments',
      userId: user.id,
    },
    extra: {
      transactionAmount: amount,
    },
  })
}
```

### 7. Performance Monitoring

```typescript
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  name: 'Complex Calculation',
  op: 'task',
})

// Tu código
await complexOperation()

transaction.finish()
```

## Beneficios

- ✅ **Error tracking en tiempo real**
- ✅ **Source maps automáticos**
- ✅ **Session replay para debugging**
- ✅ **Performance monitoring**
- ✅ **Release tracking**
- ✅ **Alertas por email/Slack**

## Alternativas

- **LogRocket**: Mejor para product analytics + error tracking
- **Bugsnag**: Más simple, menos features
- **Rollbar**: Bueno para backend errors
- **DataDog**: Enterprise, muy completo pero caro

## Siguiente paso

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
