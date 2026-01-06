import { AccountsList } from '@/components/accounts/accounts-list'

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cuentas Bancarias</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus cuentas y saldos
        </p>
      </div>
      <AccountsList />
    </div>
  )
}
