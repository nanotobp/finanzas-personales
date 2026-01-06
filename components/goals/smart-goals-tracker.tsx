'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Target, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Flag,
  Circle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SmartGoal {
  id: string
  name: string
  specific_description: string
  target_amount: number
  current_amount: number
  target_date: string
  relevant_reason: string
  achievable_plan: string
  expected_monthly_contribution: number
  priority: number
  progress_percentage: number
  is_on_track: boolean
  days_remaining: number
  required_daily_amount: number
  milestones: Milestone[]
  recent_contributions: DailyTracking[]
}

interface Milestone {
  id: string
  title: string
  target_amount: number
  target_date: string
  completed: boolean
  completed_at?: string
}

interface DailyTracking {
  id: string
  date: string
  amount_contributed: number
  notes: string
  mood: string
}

function EmptyStateGoals() {
  return (
    <div className="text-center py-8 px-4">
      <div className="text-8xl mb-6">🎯</div>
      <h3 className="text-xl font-semibold mb-2">Define tus Metas Financieras</h3>
      <p className="text-muted-foreground max-w-lg mx-auto">
        Crea objetivos SMART para alcanzar tus sueños financieros de forma estructurada.
        Cada objetivo debe ser Específico, Medible, Alcanzable, Relevante y con Tiempo definido.
      </p>
    </div>
  )
}

export function SmartGoalsTracker() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contributionDialog, setContributionDialog] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionNotes, setContributionNotes] = useState('')
  const [selectedMood, setSelectedMood] = useState('confident')
  
  const [formData, setFormData] = useState({
    name: '',
    specific_description: '',
    target_amount: '',
    target_date: new Date(),
    relevant_reason: '',
    achievable_plan: '',
    priority: '3'
  })

  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['smart-goals'],
    queryFn: async (): Promise<SmartGoal[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })

      if (!goalsData) return []

      const goalsWithDetails = await Promise.all(
        goalsData.map(async (goal) => {
          // Obtener milestones
          const { data: milestones } = await supabase
            .from('goal_milestones')
            .select('*')
            .eq('goal_id', goal.id)
            .order('target_date', { ascending: true })

          // Obtener tracking reciente
          const { data: tracking } = await supabase
            .from('goal_daily_tracking')
            .select('*')
            .eq('goal_id', goal.id)
            .order('date', { ascending: false })
            .limit(7)

          // Calcular días restantes
          const daysRemaining = goal.target_date 
            ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0

          // Calcular cantidad diaria requerida
          const remaining = Number(goal.target_amount) - Number(goal.current_amount)
          const requiredDaily = daysRemaining > 0 ? remaining / daysRemaining : 0

          return {
            ...goal,
            progress_percentage: Number(goal.progress_percentage) || 0,
            is_on_track: goal.is_on_track ?? true,
            days_remaining: daysRemaining,
            required_daily_amount: requiredDaily,
            milestones: milestones || [],
            recent_contributions: tracking || []
          }
        })
      )

      return goalsWithDetails
    }
  })

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const targetAmount = parseFloat(formData.target_amount)
      const monthsDiff = Math.ceil(
        (formData.target_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      )
      const expectedMonthly = monthsDiff > 0 ? targetAmount / monthsDiff : 0

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: user.id,
          name: formData.name,
          specific_description: formData.specific_description,
          target_amount: targetAmount,
          current_amount: 0,
          target_date: format(formData.target_date, 'yyyy-MM-dd'),
          relevant_reason: formData.relevant_reason,
          achievable_plan: formData.achievable_plan,
          expected_monthly_contribution: expectedMonthly,
          priority: parseInt(formData.priority)
        })
        .select()
        .single()

      if (error) throw error

      // Crear milestones automáticos (25%, 50%, 75%, 100%)
      const milestones = [
        { percentage: 0.25, title: 'Primer 25%' },
        { percentage: 0.50, title: 'Mitad del camino' },
        { percentage: 0.75, title: 'Casi llegamos' },
        { percentage: 1.00, title: 'Meta alcanzada' }
      ]

      for (const milestone of milestones) {
        const milestoneDate = new Date(formData.target_date)
        milestoneDate.setDate(
          milestoneDate.getDate() * milestone.percentage
        )

        await supabase
          .from('goal_milestones')
          .insert({
            goal_id: data.id,
            title: milestone.title,
            target_amount: targetAmount * milestone.percentage,
            target_date: format(milestoneDate, 'yyyy-MM-dd')
          })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-goals'] })
      setDialogOpen(false)
      setFormData({
        name: '',
        specific_description: '',
        target_amount: '',
        target_date: new Date(),
        relevant_reason: '',
        achievable_plan: '',
        priority: '3'
      })
      toast({
        title: '✅ Objetivo SMART Creado',
        description: 'Tu objetivo ha sido registrado exitosamente'
      })
    }
  })

  const addContributionMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string, amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Registrar tracking diario
      await supabase
        .from('goal_daily_tracking')
        .insert({
          goal_id: goalId,
          user_id: user.id,
          amount_contributed: amount,
          notes: contributionNotes,
          mood: selectedMood
        })

      // Actualizar monto actual del objetivo
      const { data: goal } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('id', goalId)
        .single()

      if (goal) {
        await supabase
          .from('savings_goals')
          .update({
            current_amount: Number(goal.current_amount) + amount,
            last_contribution_date: format(new Date(), 'yyyy-MM-dd')
          })
          .eq('id', goalId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-goals'] })
      setContributionDialog(null)
      setContributionAmount('')
      setContributionNotes('')
      setSelectedMood('confident')
      toast({
        title: '💰 Contribución Registrada',
        description: '+10 puntos ganados'
      })
    }
  })

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600 bg-red-100'
    if (priority >= 4) return 'text-orange-600 bg-orange-100'
    if (priority >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-blue-600 bg-blue-100'
  }

  const getMoodEmoji = (mood: string) => {
    const moods = {
      motivated: '🚀',
      confident: '😊',
      neutral: '😐',
      concerned: '😟',
      frustrated: '😤'
    }
    return moods[mood as keyof typeof moods] || '😐'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Objetivos SMART</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos SMART 2026
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Objetivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Objetivo SMART</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nombre del Objetivo (Específico)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Ahorrar para viaje a Europa"
                    />
                  </div>

                  <div>
                    <Label>Descripción Detallada</Label>
                    <Textarea
                      value={formData.specific_description}
                      onChange={(e) => setFormData({ ...formData, specific_description: e.target.value })}
                      placeholder="¿Qué quieres lograr exactamente? Sé específico."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Monto Objetivo (Medible)</Label>
                      <Input
                        type="number"
                        value={formData.target_amount}
                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                        placeholder="5000000"
                      />
                    </div>
                    <div>
                      <Label>Fecha Límite (Tiempo Definido)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(formData.target_date, 'PPP', { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.target_date}
                            onSelect={(date: Date | undefined) => date && setFormData({ ...formData, target_date: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label>¿Por qué es Relevante?</Label>
                    <Textarea
                      value={formData.relevant_reason}
                      onChange={(e) => setFormData({ ...formData, relevant_reason: e.target.value })}
                      placeholder="¿Cómo se alinea con tus objetivos de vida?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Plan de Acción (Alcanzable)</Label>
                    <Textarea
                      value={formData.achievable_plan}
                      onChange={(e) => setFormData({ ...formData, achievable_plan: e.target.value })}
                      placeholder="¿Cómo planeas lograr este objetivo? Pasos concretos."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Prioridad</Label>
                    <Select 
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">🔴 Crítica (5)</SelectItem>
                        <SelectItem value="4">🟠 Alta (4)</SelectItem>
                        <SelectItem value="3">🟡 Media (3)</SelectItem>
                        <SelectItem value="2">🔵 Baja (2)</SelectItem>
                        <SelectItem value="1">⚪ Mínima (1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => createGoalMutation.mutate()}
                    disabled={!formData.name || !formData.target_amount || createGoalMutation.isPending}
                  >
                    Crear Objetivo SMART
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {(!goals || goals.length === 0) ? (
        <Card>
          <CardContent className="py-8">
            <EmptyStateGoals />
          </CardContent>
        </Card>
      ) : (
        goals.map((goal) => (
          <Card key={goal.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{goal.name}</h3>
                    <Badge className={getPriorityColor(goal.priority)}>
                      <Flag className="h-3 w-3 mr-1" />
                      Prioridad {goal.priority}
                    </Badge>
                    {goal.is_on_track ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        En camino
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Atrasado
                      </Badge>
                    )}
                  </div>
                  {goal.specific_description && (
                    <p className="text-sm text-muted-foreground">{goal.specific_description}</p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">
                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                  </span>
                  <span className="text-muted-foreground">
                    {goal.progress_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={goal.progress_percentage} className="h-3" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    Días restantes
                  </div>
                  <div className="text-lg font-bold">
                    {goal.days_remaining > 0 ? goal.days_remaining : 0}
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3 w-3" />
                    Falta ahorrar
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(Number(goal.target_amount) - Number(goal.current_amount))}
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="h-3 w-3" />
                    Diario requerido
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(goal.required_daily_amount)}
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Hitos</h4>
                  <div className="space-y-1">
                    {goal.milestones.map((milestone) => (
                      <div 
                        key={milestone.id}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          milestone.completed ? 'bg-green-50 text-green-700' : 'bg-muted/30'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {milestone.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          {milestone.title}
                        </span>
                        <span className="text-xs">{formatCurrency(milestone.target_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Contributions */}
              {goal.recent_contributions && goal.recent_contributions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Contribuciones Recientes</h4>
                  <div className="space-y-1">
                    {goal.recent_contributions.slice(0, 3).map((contribution) => (
                      <div key={contribution.id} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                        <span className="flex items-center gap-2">
                          {getMoodEmoji(contribution.mood)}
                          {format(new Date(contribution.date), 'dd/MM/yyyy')}
                        </span>
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(contribution.amount_contributed)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Contribution Button */}
              <Dialog 
                open={contributionDialog === goal.id} 
                onOpenChange={(open) => setContributionDialog(open ? goal.id : null)}
              >
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Contribución de Hoy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Contribución</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Monto</Label>
                      <Input
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label>¿Cómo te sientes con tu progreso?</Label>
                      <Select value={selectedMood} onValueChange={setSelectedMood}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="motivated">🚀 Motivado</SelectItem>
                          <SelectItem value="confident">😊 Confiado</SelectItem>
                          <SelectItem value="neutral">😐 Neutral</SelectItem>
                          <SelectItem value="concerned">😟 Preocupado</SelectItem>
                          <SelectItem value="frustrated">😤 Frustrado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notas (opcional)</Label>
                      <Textarea
                        value={contributionNotes}
                        onChange={(e) => setContributionNotes(e.target.value)}
                        placeholder="Cualquier comentario sobre esta contribución..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => addContributionMutation.mutate({
                        goalId: goal.id,
                        amount: parseFloat(contributionAmount)
                      })}
                      disabled={!contributionAmount || addContributionMutation.isPending}
                    >
                      Registrar Contribución
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}