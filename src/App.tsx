import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { ErrorBoundary } from '@/components/error-boundary'
import DashboardLayout from '@/app/(dashboard)/layout'

import LoginPage from '@/app/(auth)/login/page'
import SignupPage from '@/app/(auth)/signup/page'

import DashboardPage from '@/app/(dashboard)/dashboard/page'
import AdvancedPage from '@/app/(dashboard)/advanced/page'
import FlowPage from '@/app/(dashboard)/flow/page'
import ReportsPage from '@/app/(dashboard)/reports/page'
import CardsPage from '@/app/(dashboard)/cards/page'
import FinancialCalculatorPage from '@/app/(dashboard)/financial-calculator/page'
import UserProfilePage from '@/app/(dashboard)/user-profile/page'
import BudgetsPage from '@/app/(dashboard)/budgets/page'
import CashFlowPage from '@/app/(dashboard)/cash-flow/page'
import ProjectsPage from '@/app/(dashboard)/projects/page'
import SavingsRatePage from '@/app/(dashboard)/savings-rate/page'
import ProfilePage from '@/app/(dashboard)/profile/page'
import TaxesPage from '@/app/(dashboard)/taxes/page'
import AccountsPage from '@/app/(dashboard)/accounts/page'
import ExpensesPage from '@/app/(dashboard)/expenses/page'
import RulesPage from '@/app/(dashboard)/rules/page'
import ClientsPage from '@/app/(dashboard)/clients/page'
import MoneyFlowPage from '@/app/(dashboard)/money-flow/page'
import InvoicesPage from '@/app/(dashboard)/invoices/page'
import SettingsPage from '@/app/(dashboard)/settings/page'
import ActivityPage from '@/app/(dashboard)/activity/page'
import NewInvoicePage from '@/app/(dashboard)/invoices/new/page'
import GoalsPage from '@/app/(dashboard)/goals/page'
import IncomePage from '@/app/(dashboard)/income/page'
import InvoicesDuePage from '@/app/(dashboard)/invoices-due/page'
import NetWorthPage from '@/app/(dashboard)/net-worth/page'
import RecommendationsPage from '@/app/(dashboard)/recommendations/page'
import FinancialHealthPage from '@/app/(dashboard)/financial-health/page'
import ClearCachePage from '@/app/(dashboard)/clear-cache/page'
import ProspectsPage from '@/app/(dashboard)/prospects/page'
import SubscriptionsPage from '@/app/(dashboard)/subscriptions/page'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Página no encontrada</h1>
        <p className="text-muted-foreground">La ruta solicitada no existe.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Providers>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/advanced" element={<AdvancedPage />} />
              <Route path="/flow" element={<FlowPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/cards" element={<CardsPage />} />
              <Route path="/financial-calculator" element={<FinancialCalculatorPage />} />
              <Route path="/user-profile" element={<UserProfilePage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/cash-flow" element={<CashFlowPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/savings-rate" element={<SavingsRatePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/taxes" element={<TaxesPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/money-flow" element={<MoneyFlowPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/invoices/new" element={<NewInvoicePage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/income" element={<IncomePage />} />
              <Route path="/invoices-due" element={<InvoicesDuePage />} />
              <Route path="/net-worth" element={<NetWorthPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/financial-health" element={<FinancialHealthPage />} />
              <Route path="/clear-cache" element={<ClearCachePage />} />
              <Route path="/prospects" element={<ProspectsPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </Providers>
  )
}
