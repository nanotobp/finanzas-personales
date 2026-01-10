'use client'

import { FinancialCalculator } from '@/components/financial-calculator/financial-calculator'

export default function FinancialCalculatorPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calculadora Financiera</h1>
        <p className="text-muted-foreground mt-2">
          Analiza tus opciones de compra con inteligencia financiera personalizada
        </p>
      </div>
      
      <FinancialCalculator />
    </div>
  )
}
