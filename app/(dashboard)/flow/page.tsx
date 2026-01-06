'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MoneyFlowSankey } from '@/components/analytics/money-flow-sankey'
import { TopMerchants } from '@/components/analytics/top-merchants'
import { CashFlowWaterfall } from '@/components/analytics/cash-flow-waterfall'
import { BurnRate } from '@/components/analytics/burn-rate'
import { GitBranch, TrendingDown } from 'lucide-react'

export default function FlowAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Análisis de Flujo</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visualiza cómo se mueve tu dinero
        </p>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Distribución
          </TabsTrigger>
          <TabsTrigger value="waterfall" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Cascada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Distribución por Categorías</h2>
            <p className="text-sm text-muted-foreground">
              Visualiza hacia dónde va cada peso y qué categorías consumen más presupuesto
            </p>
          </div>
          <div className="grid gap-6">
            <MoneyFlowSankey />
            <TopMerchants />
          </div>
        </TabsContent>

        <TabsContent value="waterfall" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Flujo de Efectivo (Cascada)</h2>
            <p className="text-sm text-muted-foreground">
              Análisis detallado de cómo tus ingresos se transforman en tu balance final
            </p>
          </div>
          <div className="grid gap-6">
            <CashFlowWaterfall />
            <BurnRate />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
