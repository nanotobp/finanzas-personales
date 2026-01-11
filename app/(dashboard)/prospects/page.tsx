'use client'

import { useState, lazy, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamic imports para code splitting
const ProspectList = lazy(() => import('@/components/prospects').then(m => ({ default: m.ProspectList })))
const ProspectKanban = lazy(() => import('@/components/prospects').then(m => ({ default: m.ProspectKanban })))
const ProspectDashboard = lazy(() => import('@/components/prospects').then(m => ({ default: m.ProspectDashboard })))
const ProspectFormDialog = lazy(() => import('@/components/prospects').then(m => ({ default: m.ProspectFormDialog })))

export default function ProspectsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<any>(null)

  const handleEdit = (prospect: any) => {
    setSelectedProspect(prospect)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedProspect(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CRM - Prospectos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu pipeline de ventas y oportunidades
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Prospecto
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ProspectList onEdit={handleEdit} />
          </Suspense>
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ProspectKanban onEdit={handleEdit} />
          </Suspense>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ProspectDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Suspense fallback={null}>
        <ProspectFormDialog
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          prospect={selectedProspect}
        />
      </Suspense>
    </div>
  )
}
