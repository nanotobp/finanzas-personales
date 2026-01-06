import { FinancialStatementGenerator } from '@/components/financial-statements/financial-statement-generator'

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Balance Financiero</h1>
        <p className="text-gray-600 mt-1">
          Genera e imprime estados financieros para presentar al banco
        </p>
      </div>
      
      <FinancialStatementGenerator />
    </div>
  )
}
