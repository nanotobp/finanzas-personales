'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Flame, 
  Target,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'

interface Habit {
  id: string
  name: string
  description: string
  target_frequency: 'daily' | 'weekly' | 'monthly'
  category: string
  reminder_enabled: boolean
  reminder_time: string | null
  completions_this_period: number
  current_streak: number
  total_completions: number
  completion_rate: number
}

const categoryIcons = {
  saving: '💰',
  investing: '📈',
  budgeting: '📊',
  tracking: '📝',
  learning: '📚',
  reviewing: '🔍'
}

const frequencyTargets = {
  daily: { target: 1, label: 'por día' },
  weekly: { target: 1, label: 'por semana' },
  monthly: { target: 1, label: 'por mes' }
}

function EmptyStateHabits() {
  return (
    <div className="text-center py-8 px-4">
      <div className="text-8xl mb-6">📅</div>
      <h3 className="text-xl font-semibold mb-2">Construye Hábitos Ganadores</h3>
      <p className="text-muted-foreground max-w-lg mx-auto">
        La consistencia es clave. Crea hábitos diarios, semanales o mensuales para mejorar tu salud financiera.
        Pequeñas acciones repetidas generan grandes resultados.
      </p>
    </div>
  )
}

export function FinancialHabits() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_frequency: 'daily' as const,
    category: 'tracking',
    reminder_enabled: true,
    reminder_time: '09:00'
  })

  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { userId } = useAuth()

  const { data: habits, isLoading } = useQuery({
    queryKey: ['financial-habits'],
    queryFn: async (): Promise<Habit[]> => {
      if (!userId) return []

      // Obtener hábitos
      const { data: habitsData } = await supabase
        .from('financial_habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!habitsData) return []

      // Para cada hábito, calcular estadísticas
      const habitsWithStats = await Promise.all(
        habitsData.map(async (habit) => {
          const now = new Date()
          let periodStart: Date = new Date()

          switch (habit.target_frequency) {
            case 'daily':
              periodStart = new Date()
              periodStart.setHours(0, 0, 0, 0)
              break
            case 'weekly':
              periodStart = new Date()
              periodStart.setDate(now.getDate() - now.getDay())
              periodStart.setHours(0, 0, 0, 0)
              break
            case 'monthly':
              periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
              break
          }

          // Completaciones en el período actual
          const { data: periodCompletions } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('habit_id', habit.id)
            .gte('completed_at', periodStart.toISOString())

          // Total de completaciones
          const { data: totalCompletions } = await supabase
            .from('habit_completions')
            .select('*', { count: 'exact', head: true })
            .eq('habit_id', habit.id)

          // Calcular racha actual
          const { data: recentCompletions } = await supabase
            .from('habit_completions')
            .select('completed_at')
            .eq('habit_id', habit.id)
            .order('completed_at', { ascending: false })
            .limit(30)

          let currentStreak = 0
          if (recentCompletions && recentCompletions.length > 0) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            for (let i = 0; i < recentCompletions.length; i++) {
              const completionDate = new Date(recentCompletions[i].completed_at)
              completionDate.setHours(0, 0, 0, 0)
              
              const expectedDate = new Date(today)
              expectedDate.setDate(today.getDate() - currentStreak)
              
              if (completionDate.getTime() === expectedDate.getTime()) {
                currentStreak++
              } else {
                break
              }
            }
          }

          const completionsCount = periodCompletions?.length || 0
          const target = frequencyTargets[habit.target_frequency as keyof typeof frequencyTargets].target
          const completionRate = (completionsCount / target) * 100

          return {
            ...habit,
            completions_this_period: completionsCount,
            current_streak: currentStreak,
            total_completions: totalCompletions?.length || 0,
            completion_rate: Math.min(100, completionRate)
          }
        })
      )

      return habitsWithStats
    },
    enabled: !!userId
  })

  const createHabitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user')

      const { error } = await supabase
        .from('financial_habits')
        .insert({
          user_id: userId,
          ...formData
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-habits'] })
      setDialogOpen(false)
      setFormData({
        name: '',
        description: '',
        target_frequency: 'daily',
        category: 'tracking',
        reminder_enabled: true,
        reminder_time: '09:00'
      })
      toast({
        title: '¡Hábito creado!',
        description: 'Tu nuevo hábito financiero ha sido agregado.'
      })
    }
  })

  const completeHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      if (!userId) throw new Error('No user')

      const { error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: userId,
          mood: 'good'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-habits'] })
      queryClient.invalidateQueries({ queryKey: ['user-points'] })
      toast({
        title: '✅ ¡Completado!',
        description: '+10 puntos ganados'
      })
    }
  })

  const getPeriodLabel = (frequency: string, completions: number, rate: number) => {
    const target = frequencyTargets[frequency as keyof typeof frequencyTargets]
    return `${completions}/${target.target} ${target.label} (${Math.round(rate)}%)`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hábitos Financieros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hábitos Financieros
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Hábito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Hábito Financiero</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre del Hábito</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Revisar gastos diarios"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="¿Por qué es importante este hábito?"
                  />
                </div>
                <div>
                  <Label>Frecuencia</Label>
                  <Select 
                    value={formData.target_frequency}
                    onValueChange={(value: any) => setFormData({ ...formData, target_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tracking">📝 Seguimiento</SelectItem>
                      <SelectItem value="saving">💰 Ahorro</SelectItem>
                      <SelectItem value="budgeting">📊 Presupuesto</SelectItem>
                      <SelectItem value="investing">📈 Inversión</SelectItem>
                      <SelectItem value="learning">📚 Aprendizaje</SelectItem>
                      <SelectItem value="reviewing">🔍 Revisión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Recordatorios</Label>
                  <Switch
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                </div>
                {formData.reminder_enabled && (
                  <div>
                    <Label>Hora del Recordatorio</Label>
                    <Input
                      type="time"
                      value={formData.reminder_time || '09:00'}
                      onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                    />
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={() => createHabitMutation.mutate()}
                  disabled={!formData.name || createHabitMutation.isPending}
                >
                  Crear Hábito
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!habits || habits.length === 0 ? (
          <EmptyStateHabits />
        ) : (
          habits.map((habit) => (
            <div 
              key={habit.id} 
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{categoryIcons[habit.category as keyof typeof categoryIcons]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{habit.name}</h4>
                    {habit.current_streak > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {habit.current_streak} días
                      </Badge>
                    )}
                  </div>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground mb-2">{habit.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getPeriodLabel(habit.target_frequency, habit.completions_this_period, habit.completion_rate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {habit.total_completions} total
                    </span>
                  </div>
                  <Progress value={habit.completion_rate} className="h-1.5 mt-2" />
                </div>
              </div>
              <Button
                size="sm"
                variant={habit.completion_rate >= 100 ? "secondary" : "default"}
                onClick={() => completeHabitMutation.mutate(habit.id)}
                disabled={habit.completion_rate >= 100 || completeHabitMutation.isPending}
              >
                {habit.completion_rate >= 100 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completado
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Marcar
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
