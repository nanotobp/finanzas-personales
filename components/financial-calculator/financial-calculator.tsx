'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getMonthEndDate } from '@/lib/utils'
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Lightbulb,
  Wallet,
  CreditCard,
  Calendar,
  Percent,
  DollarSign,
  PiggyBank,
} from 'lucide-react'

type PurchaseMode = 'financing' | 'cash'
type AmortizationSystem = 'french' | 'german'

interface FinancialData {
  balance: number // Balance disponible (ingresos - gastos del mes)
  accountsBalance: number // Saldo total en cuentas bancarias
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number // Porcentaje de ahorro
  emergencyFundMonths: number // Meses de fondo de emergencia
  healthScore: number
}

interface AmortizationRow {
  month: number
  payment: number
  interest: number
  principal: number
  balance: number
}

export const FinancialCalculator = memo(function FinancialCalculator() {
  const supabase = createClient()
  
  // Estados del formulario
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('financing')
  const [amount, setAmount] = useState<string>('65000000')
  const [downPayment, setDownPayment] = useState<string>('0')
  const [interestRate, setInterestRate] = useState<string>('15')
  const [term, setTerm] = useState<string>('60')
  const [system, setSystem] = useState<AmortizationSystem>('french')
  
  // Estados de cálculo
  const [amortizationTable, setAmortizationTable] = useState<AmortizationRow[]>([])
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0)
  const [totalInterest, setTotalInterest] = useState<number>(0)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  
  // Obtener datos financieros del usuario
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  const { data: financialData, isLoading, error } = useQuery({
    queryKey: ['financial-data', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return null

      try {
        const today = new Date()
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
        
        const currentMonthEnd = getMonthEndDate(currentMonth)
        const lastMonthEnd = getMonthEndDate(lastMonthStr)

        // Optimización: Obtener todos los datos en paralelo con Promise.all
        const [
          { data: accounts, error: accountsError },
          { data: currentIncome, error: incomeError },
          { data: paidInvoices, error: invoicesError },
          { data: currentExpenses, error: expensesError }
        ] = await Promise.all([
          supabase.from('accounts').select('balance').eq('user_id', userData.id),
          supabase.from('transactions').select('amount').eq('user_id', userData.id).eq('type', 'income').gte('date', `${currentMonth}-01`).lte('date', currentMonthEnd),
          supabase.from('invoices').select('amount').eq('user_id', userData.id).eq('status', 'paid').gte('paid_date', `${currentMonth}-01`).lte('paid_date', currentMonthEnd).not('paid_date', 'is', null),
          supabase.from('transactions').select('amount').eq('user_id', userData.id).eq('type', 'expense').gte('date', `${currentMonth}-01`).lte('date', currentMonthEnd)
        ])

        if (accountsError) {
          console.error('Error fetching accounts:', accountsError)
          throw accountsError
        }

        if (incomeError) {
          console.error('Error fetching income:', incomeError)
          throw incomeError
        }

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError)
          throw invoicesError
        }

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError)
          throw expensesError
        }

        const totalAccountsBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0

        // Si no hay ingresos este mes, buscar en el mes anterior
        let monthlyIncome = 
          (currentIncome?.reduce((sum, t) => sum + t.amount, 0) || 0) +
          (paidInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0)

        let monthlyExpenses = currentExpenses?.reduce((sum, t) => sum + t.amount, 0) || 0

        // Si no hay datos del mes actual, obtener del mes anterior (también en paralelo)
        if (monthlyIncome === 0 || monthlyExpenses === 0) {
          console.log('No data for current month, trying last month...')
          
          const [
            { data: lastIncome, error: lastIncomeError },
            { data: lastPaidInvoices, error: lastInvoicesError },
            { data: lastExpenses, error: lastExpensesError }
          ] = await Promise.all([
            supabase.from('transactions').select('amount').eq('user_id', userData.id).eq('type', 'income').gte('date', `${lastMonthStr}-01`).lte('date', lastMonthEnd),
            supabase.from('invoices').select('amount').eq('user_id', userData.id).eq('status', 'paid').gte('paid_date', `${lastMonthStr}-01`).lte('paid_date', lastMonthEnd).not('paid_date', 'is', null),
            supabase.from('transactions').select('amount').eq('user_id', userData.id).eq('type', 'expense').gte('date', `${lastMonthStr}-01`).lte('date', lastMonthEnd)
          ])

          if (lastIncomeError) {
            console.error('Error fetching last month income:', lastIncomeError)
            throw lastIncomeError
          }

          if (lastInvoicesError) {
            console.error('Error fetching last month invoices:', lastInvoicesError)
            throw lastInvoicesError
          }

          if (lastExpensesError) {
            console.error('Error fetching last month expenses:', lastExpensesError)
            throw lastExpensesError
          }

          if (monthlyIncome === 0) {
            monthlyIncome = 
              (lastIncome?.reduce((sum, t) => sum + t.amount, 0) || 0) +
              (lastPaidInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0)
          }

          if (monthlyExpenses === 0) {
            monthlyExpenses = lastExpenses?.reduce((sum, t) => sum + t.amount, 0) || 0
          }
        }

        // Calcular balance neto (disponible después de gastos)
        const netBalance = monthlyIncome - monthlyExpenses
        
        // Calcular score de salud financiera mejorado
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
        const emergencyFundMonths = monthlyExpenses > 0 ? totalAccountsBalance / monthlyExpenses : 0
        const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 100
        
        let healthScore = 0
        
        // 1. Tasa de ahorro (40 puntos): 20%+ = excelente
        if (savingsRate >= 20) healthScore += 40
        else if (savingsRate >= 10) healthScore += 30
        else if (savingsRate >= 5) healthScore += 20
        else if (savingsRate > 0) healthScore += 10
        
        // 2. Fondo de emergencia (30 puntos): 6+ meses = excelente
        if (emergencyFundMonths >= 6) healthScore += 30
        else if (emergencyFundMonths >= 3) healthScore += 20
        else if (emergencyFundMonths >= 1) healthScore += 10
        
        // 3. Ratio gastos/ingresos (30 puntos): <50% = excelente
        if (debtToIncomeRatio <= 50) healthScore += 30
        else if (debtToIncomeRatio <= 70) healthScore += 20
        else if (debtToIncomeRatio <= 90) healthScore += 10

        console.log('Financial data calculated:', {
          netBalance,
          totalAccountsBalance,
          monthlyIncome,
          monthlyExpenses,
          savingsRate,
          emergencyFundMonths,
          healthScore: Math.round(healthScore)
        })

        return {
          balance: netBalance, // Balance disponible (ingresos - gastos)
          accountsBalance: totalAccountsBalance, // Saldo total en cuentas
          monthlyIncome,
          monthlyExpenses,
          savingsRate,
          emergencyFundMonths,
          healthScore: Math.round(healthScore),
        }
      } catch (error) {
        console.error('Error in financial data query:', error)
        throw error
      }
    },
    enabled: !!userData?.id,
  })

  // Calcular amortización cuando cambian los parámetros
  useEffect(() => {
    calculateAmortization()
  }, [amount, downPayment, interestRate, term, system, purchaseMode])

  const calculateAmortization = () => {
    const principal = parseFloat(amount) - parseFloat(downPayment || '0')
    const rate = parseFloat(interestRate) / 100 / 12
    const months = parseInt(term)

    if (!principal || !rate || !months || principal <= 0) {
      setAmortizationTable([])
      setMonthlyPayment(0)
      setTotalInterest(0)
      setTotalAmount(0)
      return
    }

    const table: AmortizationRow[] = []
    let remainingBalance = principal
    let totalInt = 0

    if (system === 'french') {
      // Sistema Francés (cuota fija)
      const payment = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
      
      for (let month = 1; month <= months; month++) {
        const interest = remainingBalance * rate
        const principalPaid = payment - interest
        remainingBalance -= principalPaid
        totalInt += interest

        table.push({
          month,
          payment,
          interest,
          principal: principalPaid,
          balance: Math.max(0, remainingBalance),
        })
      }
      
      setMonthlyPayment(payment)
    } else {
      // Sistema Alemán (amortización constante)
      const principalPayment = principal / months
      
      for (let month = 1; month <= months; month++) {
        const interest = remainingBalance * rate
        const payment = principalPayment + interest
        remainingBalance -= principalPayment
        totalInt += interest

        table.push({
          month,
          payment,
          interest,
          principal: principalPayment,
          balance: Math.max(0, remainingBalance),
        })
      }
      
      setMonthlyPayment(table[0]?.payment || 0)
    }

    setAmortizationTable(table)
    setTotalInterest(totalInt)
    setTotalAmount(principal + totalInt)
  }

  const getRecommendations = () => {
    if (!financialData) return []

    const recommendations: { type: 'success' | 'warning' | 'error' | 'info', message: string }[] = []
    const purchaseAmount = parseFloat(amount)
    const downPmt = parseFloat(downPayment || '0')
    
    if (purchaseMode === 'cash') {
      // Análisis para compra al contado
      const afterPurchaseBalance = financialData.accountsBalance - purchaseAmount
      const monthsOfExpenses = financialData.monthlyExpenses > 0 
        ? afterPurchaseBalance / financialData.monthlyExpenses 
        : 0

      if (purchaseAmount > financialData.accountsBalance) {
        recommendations.push({
          type: 'error',
          message: `No tienes fondos suficientes. Te faltan ${formatCurrency(purchaseAmount - financialData.accountsBalance)}.`
        })
        recommendations.push({
          type: 'warning',
          message: `Considera financiar con ${formatCurrency(downPmt > 0 ? downPmt : purchaseAmount * 0.3)} de cuota inicial.`
        })
      } else if (monthsOfExpenses < 3) {
        recommendations.push({
          type: 'warning',
          message: `Esta compra dejará tu fondo de emergencia en ${monthsOfExpenses.toFixed(1)} meses. Se recomienda mantener al menos 3 meses.`
        })
        recommendations.push({
          type: 'warning',
          message: `Aumenta tus ingresos en ${formatCurrency((3 * financialData.monthlyExpenses - afterPurchaseBalance) / 6)} mensualmente durante 6 meses antes de comprar.`
        })
      } else if (monthsOfExpenses < 6) {
        recommendations.push({
          type: 'warning',
          message: `Puedes realizar la compra, pero tu colchón financiero se reducirá a ${monthsOfExpenses.toFixed(1)} meses.`
        })
        recommendations.push({
          type: 'success',
          message: `Considera esperar 3 meses ahorrando ${formatCurrency((6 * financialData.monthlyExpenses - afterPurchaseBalance) / 3)} mensuales.`
        })
      } else {
        recommendations.push({
          type: 'success',
          message: `✓ Puedes realizar esta compra al contado sin comprometer tu estabilidad financiera.`
        })
        recommendations.push({
          type: 'success',
          message: `Mantendrás ${monthsOfExpenses.toFixed(1)} meses de gastos en reserva.`
        })
      }
    } else {
      // Análisis para financiamiento
      const disposableIncome = financialData.monthlyIncome - financialData.monthlyExpenses
      const paymentToIncomeRatio = financialData.monthlyIncome > 0 
        ? (monthlyPayment / financialData.monthlyIncome) * 100 
        : 0
      const remainingAfterPayment = disposableIncome - monthlyPayment

      // Validar si no hay ingresos registrados (ni en mes actual ni anterior)
      if (financialData.monthlyIncome === 0) {
        recommendations.push({
          type: 'warning',
          message: `No tienes ingresos registrados en los últimos 2 meses. El análisis se basa en tu saldo en cuentas (${formatCurrency(financialData.accountsBalance)}).`
        })
        
        // Analizar solo basado en balance
        if (downPmt > financialData.accountsBalance) {
          recommendations.push({
            type: 'error',
            message: `No puedes cubrir la cuota inicial de ${formatCurrency(downPmt)}. Tienes ${formatCurrency(financialData.accountsBalance)}.`
          })
        } else {
          recommendations.push({
            type: 'info',
            message: `Registra tus ingresos mensuales para obtener un análisis más preciso de capacidad de pago.`
          })
        }
        return recommendations
      }

      if (downPmt > financialData.accountsBalance) {
        recommendations.push({
          type: 'error',
          message: `No puedes cubrir la cuota inicial de ${formatCurrency(downPmt)}. Tienes ${formatCurrency(financialData.accountsBalance)}.`
        })
        recommendations.push({
          type: 'warning',
          message: `Reduce la cuota inicial a ${formatCurrency(financialData.accountsBalance * 0.8)} o ahorra ${formatCurrency(downPmt - financialData.accountsBalance)} primero.`
        })
      }

      if (paymentToIncomeRatio > 30) {
        recommendations.push({
          type: 'error',
          message: `La cuota representa ${paymentToIncomeRatio.toFixed(1)}% de tus ingresos. Se recomienda no superar el 30%.`
        })
        recommendations.push({
          type: 'warning',
          message: `Debes aumentar tus ingresos en ${formatCurrency(monthlyPayment / 0.3 - financialData.monthlyIncome)} o reducir gastos en ${formatCurrency(financialData.monthlyExpenses - (financialData.monthlyIncome - monthlyPayment / 0.3))}.`
        })
      } else if (paymentToIncomeRatio > 20) {
        recommendations.push({
          type: 'warning',
          message: `La cuota es ${paymentToIncomeRatio.toFixed(1)}% de tus ingresos. Es manejable pero ajustado.`
        })
        recommendations.push({
          type: 'success',
          message: `Considera reducir presupuestos en ${formatCurrency(monthlyPayment * 0.2)} para mayor holgura.`
        })
      } else {
        recommendations.push({
          type: 'success',
          message: `✓ La cuota (${paymentToIncomeRatio.toFixed(1)}% de ingresos) es muy manejable.`
        })
      }

      if (remainingAfterPayment < financialData.monthlyExpenses * 0.2) {
        recommendations.push({
          type: 'warning',
          message: `Tendrás ${formatCurrency(remainingAfterPayment)} libre después de la cuota. Muy ajustado.`
        })
        recommendations.push({
          type: 'warning',
          message: `Busca aumentar el plazo a ${Math.ceil(parseInt(term) * 1.5)} meses o incrementa tus ingresos.`
        })
      } else {
        recommendations.push({
          type: 'success',
          message: `Te quedarán ${formatCurrency(remainingAfterPayment)} mensuales después de la cuota.`
        })
      }

      // Comparación con compra al contado
      const monthsToSave = purchaseAmount > 0 ? purchaseAmount / disposableIncome : 0
      if (monthsToSave < parseInt(term) / 2 && disposableIncome > 0) {
        recommendations.push({
          type: 'info',
          message: `Podrías ahorrar y comprar al contado en ${Math.ceil(monthsToSave)} meses, ahorrando ${formatCurrency(totalInterest)} en intereses.`
        })
      }
    }

    // Recomendaciones basadas en salud financiera
    if (financialData.healthScore < 40) {
      recommendations.push({
        type: 'error',
        message: `Tu salud financiera es baja (${financialData.healthScore}/100). Prioriza estabilizar tus finanzas antes de grandes compras.`
      })
    } else if (financialData.healthScore < 60) {
      recommendations.push({
        type: 'warning',
        message: `Tu salud financiera es regular (${financialData.healthScore}/100). Procede con precaución.`
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-pulse">Cargando datos financieros...</div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">Cargando datos financieros...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.error('Query error:', error)
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <div className="text-destructive font-semibold">Error al cargar datos financieros</div>
          <div className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </div>
          <div className="text-xs text-muted-foreground">
            Revisa la consola del navegador (F12) para más detalles.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!financialData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">No se pudieron cargar los datos financieros. Por favor, intenta de nuevo.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Panel izquierdo: Datos financieros */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Tu Situación Financiera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {financialData && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Salud Financiera</span>
                  <Badge variant={
                    financialData.healthScore >= 70 ? 'default' :
                    financialData.healthScore >= 40 ? 'secondary' : 'destructive'
                  }>
                    {financialData.healthScore}/100
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${financialData.healthScore}%` }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-4 w-4" />
                    Saldo en Cuentas
                  </span>
                  <span className="font-semibold">{formatCurrency(financialData.accountsBalance)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Ingresos Mensuales
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(financialData.monthlyIncome)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    Gastos Mensuales
                  </span>
                  <span className="font-semibold text-rose-600">
                    {formatCurrency(financialData.monthlyExpenses)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Balance del Mes</span>
                  <span className={`font-semibold ${financialData.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(financialData.balance)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tasa de Ahorro</span>
                  <span className="text-sm font-medium">{financialData.savingsRate.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fondo Emergencia</span>
                  <span className="text-sm font-medium">{financialData.emergencyFundMonths.toFixed(1)} meses</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Panel central: Calculadora */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configuración de Compra
          </CardTitle>
          <CardDescription>
            Analiza tus opciones de financiamiento o compra al contado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Modo de compra */}
          <div className="space-y-3">
            <Label>Tipo de Compra</Label>
            <RadioGroup value={purchaseMode} onValueChange={(v: string) => setPurchaseMode(v as PurchaseMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="financing" id="financing" />
                <Label htmlFor="financing" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Financiamiento
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="h-4 w-4" />
                  Contado
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Monto de compra */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto de Compra (₲)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="65000000"
            />
          </div>

          {purchaseMode === 'financing' && (
            <>
              {/* Cuota inicial */}
              <div className="space-y-2">
                <Label htmlFor="downPayment">Cuota Inicial (₲)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Tasa de interés */}
              <div className="space-y-2">
                <Label htmlFor="interestRate" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Tasa de Interés Anual (%)
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="15"
                />
              </div>

              {/* Plazo */}
              <div className="space-y-2">
                <Label htmlFor="term" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Plazo (meses)
                </Label>
                <Input
                  id="term"
                  type="number"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="60"
                />
              </div>

              {/* Sistema de amortización */}
              <div className="space-y-2">
                <Label htmlFor="system">Sistema de Amortización</Label>
                <Select value={system} onValueChange={(v) => setSystem(v as AmortizationSystem)}>
                  <SelectTrigger id="system">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="french">Sistema Francés (Cuota Fija)</SelectItem>
                    <SelectItem value="german">Sistema Alemán (Amortización Constante)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {system === 'french' 
                    ? 'Cuotas iguales durante todo el plazo. Mayor interés al inicio.'
                    : 'Cuota inicial más alta, disminuye con el tiempo. Menor interés total.'}
                </p>
              </div>

              {/* Resultados del financiamiento */}
              {monthlyPayment > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cuota Mensual Inicial:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total a Pagar:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Intereses Totales:</span>
                    <span className="font-semibold text-rose-600">{formatCurrency(totalInterest)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Panel completo: Recomendaciones */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Análisis y Recomendaciones
          </CardTitle>
          <CardDescription>
            Basado en tu situación financiera actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ingresa los datos de tu compra para ver recomendaciones personalizadas.
              </AlertDescription>
            </Alert>
          ) : (
            recommendations.map((rec, idx) => (
              <Alert
                key={idx}
                variant={rec.type === 'error' ? 'destructive' : 'default'}
                className={
                  rec.type === 'success' ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950' :
                  rec.type === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950' :
                  rec.type === 'error' ? '' :
                  'border-blue-200 bg-blue-50 dark:bg-blue-950'
                }
              >
                {rec.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {rec.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                {rec.type === 'error' && <XCircle className="h-4 w-4" />}
                {rec.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
                <AlertDescription className={
                  rec.type === 'success' ? 'text-emerald-900 dark:text-emerald-100' :
                  rec.type === 'warning' ? 'text-amber-900 dark:text-amber-100' :
                  rec.type === 'info' ? 'text-blue-900 dark:text-blue-100' : ''
                }>
                  {rec.message}
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tabla de amortización */}
      {purchaseMode === 'financing' && amortizationTable.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Tabla de Amortización</CardTitle>
            <CardDescription>
              Detalle mes a mes de tu financiamiento ({system === 'french' ? 'Sistema Francés' : 'Sistema Alemán'})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Mes</th>
                    <th className="text-right p-2">Cuota</th>
                    <th className="text-right p-2">Interés</th>
                    <th className="text-right p-2">Amortización</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {amortizationTable.slice(0, 12).map((row) => (
                    <tr key={row.month} className="border-b hover:bg-muted/50">
                      <td className="p-2">{row.month}</td>
                      <td className="text-right p-2 font-medium">{formatCurrency(row.payment)}</td>
                      <td className="text-right p-2 text-rose-600">{formatCurrency(row.interest)}</td>
                      <td className="text-right p-2 text-blue-600">{formatCurrency(row.principal)}</td>
                      <td className="text-right p-2">{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                  {amortizationTable.length > 12 && (
                    <tr className="text-muted-foreground italic">
                      <td colSpan={5} className="p-2 text-center">
                        ... {amortizationTable.length - 12} meses más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
