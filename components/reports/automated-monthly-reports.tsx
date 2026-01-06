"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Mail, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from 'react'
import { EmptyStateReports } from './empty-state-reports'

interface AutomatedReport {
  id: string
  user_id: string
  report_type: string
  frequency: 'monthly' | 'quarterly' | 'yearly'
  is_active: boolean
  send_email: boolean
  last_generated_at: string | null
  created_at: string
}

interface GeneratedReport {
  id: string
  report_id: string
  generated_at: string
  period_start: string
  period_end: string
  report_data: any
  pdf_url: string | null
}

export function AutomatedMonthlyReports() {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedFrequency, setSelectedFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [sendEmail, setSendEmail] = useState(true)

  // Fetch automated reports configuration
  const { data: automatedReports, isLoading } = useQuery({
    queryKey: ['automated-reports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('automated_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AutomatedReport[]
    },
  })

  // Fetch generated reports history
  const { data: generatedReports } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('automated_reports')
        .select(`
          id,
          report_type,
          frequency
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Get generated reports for these automated reports
      const reportIds = data.map(r => r.id)
      const { data: generated, error: genError } = await supabase
        .from('generated_reports')
        .select('*')
        .in('report_id', reportIds)
        .order('generated_at', { ascending: false })
        .limit(10)

      if (genError) throw genError
      return generated as GeneratedReport[]
    },
  })

  // Create automated report
  const createReportMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('automated_reports')
        .insert({
          user_id: user.id,
          report_type: 'financial_summary',
          frequency: selectedFrequency,
          is_active: true,
          send_email: sendEmail,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] })
      toast({
        title: "Reporte automatizado creado",
        description: `Se generará automáticamente cada ${selectedFrequency === 'monthly' ? 'mes' : selectedFrequency === 'quarterly' ? 'trimestre' : 'año'}`,
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error al crear reporte",
        description: error.message,
      })
    },
  })

  // Toggle report active status
  const toggleReportMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('automated_reports')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] })
      toast({
        title: "Actualizado",
        description: "El estado del reporte ha sido actualizado",
      })
    },
  })

  // Generate report manually
  const generateReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Call the stored procedure to generate report
      const { data, error } = await supabase.rpc('generate_monthly_report', {
        p_user_id: user.id,
        p_report_id: reportId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] })
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] })
      toast({
        title: "Reporte generado",
        description: "El reporte ha sido generado exitosamente",
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error al generar reporte",
        description: error.message,
      })
    },
  })

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Mensual'
      case 'quarterly': return 'Trimestral'
      case 'yearly': return 'Anual'
      default: return frequency
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Reportes Automatizados</CardTitle>
            <CardDescription>
              Configura reportes automáticos de tus finanzas
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Nuevo Reporte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Reporte Automatizado</DialogTitle>
                <DialogDescription>
                  El reporte se generará automáticamente según la frecuencia seleccionada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedFrequency === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setSelectedFrequency('monthly')}
                    >
                      Mensual
                    </Button>
                    <Button
                      variant={selectedFrequency === 'quarterly' ? 'default' : 'outline'}
                      onClick={() => setSelectedFrequency('quarterly')}
                    >
                      Trimestral
                    </Button>
                    <Button
                      variant={selectedFrequency === 'yearly' ? 'default' : 'outline'}
                      onClick={() => setSelectedFrequency('yearly')}
                    >
                      Anual
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="send-email">Enviar por email</Label>
                  <Switch
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createReportMutation.mutate()}
                  disabled={createReportMutation.isPending}
                >
                  Crear Reporte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando reportes...
            </div>
          ) : automatedReports && automatedReports.length > 0 ? (
            <div className="space-y-3">{automatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {report.is_active ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Reporte Financiero</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline">{getFrequencyLabel(report.frequency)}</Badge>
                        {report.send_email && (
                          <Badge variant="outline">
                            <Mail className="mr-1 h-3 w-3" />
                            Email
                          </Badge>
                        )}
                        {report.last_generated_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Último: {format(new Date(report.last_generated_at), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateReportMutation.mutate(report.id)}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generar Ahora
                    </Button>
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={(checked) =>
                        toggleReportMutation.mutate({ id: report.id, isActive: checked })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateReports />
          )}
        </CardContent>
      </Card>

      {generatedReports && generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Reportes</CardTitle>
            <CardDescription>
              Últimos reportes generados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {format(new Date(report.period_start), 'MMMM yyyy', { locale: es })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Generado el {format(new Date(report.generated_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </div>
                  </div>
                  {report.pdf_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={report.pdf_url} download>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
