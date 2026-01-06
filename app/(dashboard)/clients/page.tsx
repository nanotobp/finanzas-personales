import { ClientsList } from '@/components/clients/clients-list'

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus clientes y proyectos
        </p>
      </div>
      <ClientsList />
    </div>
  )
}
