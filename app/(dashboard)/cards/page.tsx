import { CardsList } from '@/components/cards/cards-list'

export default function CardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tarjetas de Crédito</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus tarjetas y pagos
        </p>
      </div>
      <CardsList />
    </div>
  )
}
