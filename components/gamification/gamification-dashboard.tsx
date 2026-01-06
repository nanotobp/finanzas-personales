'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Star, 
  Flame, 
  Zap,
  Target,
  TrendingUp,
  Award,
  Lock
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  category: string
  badge_color: string
  earned: boolean
  earned_at?: string
  progress: number
  requirement_value: number
}

interface UserLevel {
  level: number
  current_points: number
  points_to_next: number
  total_points: number
  current_streak: number
  longest_streak: number
}

function EmptyStateGamification() {
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <div className="text-8xl mb-6">💰</div>
            <h3 className="text-xl font-semibold mb-2">¡Comienza tu Viaje Financiero!</h3>
            <p className="text-muted-foreground">
              Completa acciones para ganar puntos, desbloquear logros y subir de nivel.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Cómo Ganar Puntos
            </h4>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium">Registra Transacciones</p>
                  <p className="text-muted-foreground">+10 puntos por cada transacción registrada</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="font-medium">Ahorra Dinero</p>
                  <p className="text-muted-foreground">+25 puntos al alcanzar Gs 100,000 | +150 al alcanzar Gs 1,000,000</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-medium">Completa Objetivos</p>
                  <p className="text-muted-foreground">+100 puntos por cada meta de ahorro completada</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium">Cumple tu Presupuesto</p>
                  <p className="text-muted-foreground">+30 puntos al mantener gastos dentro del presupuesto mensual</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-medium">Mantén Rachas</p>
                  <p className="text-muted-foreground">+50 puntos por 7 días consecutivos | +200 por 30 días</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Empieza registrando tu primera transacción para desbloquear el logro "Primer Paso" 🎯</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GamificationDashboard() {
  const supabase = createClient()

  const { data: userLevel, isLoading: levelLoading } = useQuery({
    queryKey: ['user-level'],
    queryFn: async (): Promise<UserLevel> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      // Obtener o crear puntos del usuario
      let { data: points } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!points) {
        const { data: newPoints } = await supabase
          .from('user_points')
          .insert({ user_id: user.id })
          .select()
          .single()
        points = newPoints
      }

      if (!points) return {
        level: 1,
        current_points: 0,
        points_to_next: 100,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0
      }

      // Calcular nivel basado en puntos (fórmula exponencial)
      const level = Math.floor(Math.sqrt(points.total_points / 100)) + 1
      const pointsForCurrentLevel = Math.pow(level - 1, 2) * 100
      const pointsForNextLevel = Math.pow(level, 2) * 100
      const pointsInLevel = points.total_points - pointsForCurrentLevel
      const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel

      return {
        level,
        current_points: pointsInLevel,
        points_to_next: pointsNeeded,
        total_points: points.total_points,
        current_streak: points.current_streak,
        longest_streak: points.longest_streak
      }
    }
  })

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Obtener todos los logros
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: true })

      if (!allAchievements) return []

      // Obtener logros del usuario
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)

      const userAchievementMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua]) || []
      )

      // Calcular progreso para cada logro
      const achievementsWithProgress = await Promise.all(
        allAchievements.map(async (achievement) => {
          const userAchievement = userAchievementMap.get(achievement.id)
          let progress = userAchievement?.progress || 0

          // Si no está ganado, calcular progreso actual
          if (!userAchievement?.earned_at) {
            switch (achievement.requirement_type) {
              case 'transaction_count': {
                const { count } = await supabase
                  .from('transactions')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id)
                progress = count || 0
                break
              }
              case 'savings_amount': {
                const { data: goals } = await supabase
                  .from('savings_goals')
                  .select('current_amount')
                  .eq('user_id', user.id)
                progress = goals?.reduce((sum, g) => sum + Number(g.current_amount), 0) || 0
                break
              }
              case 'streak_days': {
                const { data: points } = await supabase
                  .from('user_points')
                  .select('current_streak')
                  .eq('user_id', user.id)
                  .single()
                progress = points?.current_streak || 0
                break
              }
              case 'goal_completed': {
                const { data: completedGoals, count } = await supabase
                  .from('savings_goals')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', user.id)
                  .gte('progress_percentage', 100)
                progress = count || 0
                break
              }
              case 'budget_met': {
                const { data: budgets } = await supabase
                  .from('budgets')
                  .select('amount')
                  .eq('user_id', user.id)
                // Por ahora, contar presupuestos creados como progreso
                // TODO: Implementar cálculo real cuando exista spent
                progress = budgets?.length || 0
                break
              }
            }
          }

          return {
            ...achievement,
            earned: !!userAchievement?.earned_at,
            earned_at: userAchievement?.earned_at,
            progress: Math.min(progress, achievement.requirement_value)
          }
        })
      )

      return achievementsWithProgress
    }
  })

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { icon: Trophy, color: 'text-yellow-500', label: 'Maestro' }
    if (level >= 7) return { icon: Award, color: 'text-purple-500', label: 'Experto' }
    if (level >= 5) return { icon: Star, color: 'text-blue-500', label: 'Avanzado' }
    if (level >= 3) return { icon: Zap, color: 'text-green-500', label: 'Intermedio' }
    return { icon: Target, color: 'text-gray-500', label: 'Principiante' }
  }

  if (levelLoading || achievementsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gamificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userLevel || userLevel.total_points === 0) {
    return <EmptyStateGamification />
  }

  const earnedAchievements = achievements?.filter(a => a.earned) || []
  const availableAchievements = achievements?.filter(a => !a.earned) || []
  const levelBadge = getLevelBadge(userLevel?.level || 1)
  const LevelIcon = levelBadge.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Tu Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Display */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full bg-background ${levelBadge.color}`}>
                <LevelIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">Nivel {userLevel?.level}</div>
                <div className="text-sm text-muted-foreground">{levelBadge.label}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{userLevel?.total_points}</div>
              <div className="text-sm text-muted-foreground">Puntos Totales</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{userLevel?.current_points} / {userLevel?.points_to_next} puntos</span>
              <span>Nivel {(userLevel?.level || 0) + 1}</span>
            </div>
            <Progress 
              value={(userLevel?.current_points || 0) / (userLevel?.points_to_next || 1) * 100} 
              className="h-2"
            />
          </div>
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Racha Actual</span>
            </div>
            <div className="text-3xl font-bold">{userLevel?.current_streak}</div>
            <div className="text-xs text-muted-foreground">días consecutivos</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Mejor Racha</span>
            </div>
            <div className="text-3xl font-bold">{userLevel?.longest_streak}</div>
            <div className="text-xs text-muted-foreground">récord personal</div>
          </div>
        </div>

        {/* Achievements */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              Disponibles ({availableAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="earned">
              Obtenidos ({earnedAchievements.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-3 mt-4">
            {availableAchievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>¡Has desbloqueado todos los logros!</p>
              </div>
            ) : (
              availableAchievements.map((achievement) => {
                const progressPercent = (achievement.progress / achievement.requirement_value) * 100
                return (
                  <div 
                    key={achievement.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-2xl opacity-50">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{achievement.progress} / {achievement.requirement_value}</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>
          
          <TabsContent value="earned" className="space-y-3 mt-4">
            {earnedAchievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aún no has ganado logros</p>
                <p className="text-sm mt-1">¡Empieza a usar la app para desbloquearlos!</p>
              </div>
            ) : (
              earnedAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: `${achievement.badge_color}15` }}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <Badge style={{ backgroundColor: achievement.badge_color }} className="text-xs text-white">
                        +{achievement.points} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {achievement.description}
                    </p>
                    {achievement.earned_at && (
                      <p className="text-xs text-muted-foreground">
                        Desbloqueado el {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}