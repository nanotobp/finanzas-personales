'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Check, X, UserPlus, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export function NotificationsCenter() {
  const supabase = createClient()

  // Notificaciones del sistema
  const { data: systemNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      return data || []
    },
    refetchInterval: 60000 // Refrescar cada minuto
  })

  // Notificaciones de prospectos (próximos contactos y reuniones)
  const { data: prospectNotifications } = useQuery({
    queryKey: ['prospect-notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)

      const { data: prospects } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'in', '(won,lost)')
        .or(`next_contact_date.lte.${nextWeek.toISOString().split('T')[0]},meeting_date.lte.${nextWeek.toISOString()}`)
        .order('next_contact_date', { ascending: true })

      if (!prospects) return []

      // Generar notificaciones de prospectos
      const notifications = []
      const todayStr = today.toISOString().split('T')[0]

      for (const prospect of prospects) {
        // Próximo contacto
        if (prospect.next_contact_date) {
          const contactDate = new Date(prospect.next_contact_date)
          const daysUntil = Math.ceil((contactDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysUntil <= 7) {
            notifications.push({
              id: `contact-${prospect.id}`,
              type: 'prospect',
              priority: daysUntil <= 0 ? 'urgent' : daysUntil <= 2 ? 'high' : 'normal',
              title: daysUntil === 0 ? '🚨 Contactar hoy' : daysUntil < 0 ? '⚠️ Contacto atrasado' : `📞 Próximo contacto`,
              message: `${prospect.name}${prospect.company ? ` (${prospect.company})` : ''} - ${daysUntil === 0 ? 'Hoy' : daysUntil < 0 ? `${Math.abs(daysUntil)} días atrasado` : `En ${daysUntil} días`}`,
              created_at: prospect.next_contact_date,
              is_read: false,
              link: '/prospects'
            })
          }
        }

        // Reunión programada
        if (prospect.meeting_date) {
          const meetingDate = new Date(prospect.meeting_date)
          const hoursUntil = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60))
          
          if (hoursUntil <= 168) { // 7 días = 168 horas
            const daysUntil = Math.floor(hoursUntil / 24)
            notifications.push({
              id: `meeting-${prospect.id}`,
              type: 'meeting',
              priority: hoursUntil <= 24 ? 'urgent' : hoursUntil <= 48 ? 'high' : 'normal',
              title: hoursUntil <= 24 ? '🔴 Reunión próxima' : '📅 Reunión programada',
              message: `${prospect.name}${prospect.company ? ` (${prospect.company})` : ''} - ${daysUntil === 0 ? 'Hoy' : `En ${daysUntil} días`} a las ${meetingDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
              created_at: prospect.meeting_date,
              is_read: false,
              link: '/prospects'
            })
          }
        }
      }

      return notifications
    },
    refetchInterval: 60000
  })

  // Combinar todas las notificaciones
  const allNotifications = [
    ...(systemNotifications || []),
    ...(prospectNotifications || [])
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const markAsRead = async (id: string) => {
    if (id.startsWith('contact-') || id.startsWith('meeting-')) {
      // No hacer nada para notificaciones de prospectos (son dinámicas)
      return
    }
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
  }

  const unreadCount = allNotifications.filter(n => !n.is_read).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {allNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allNotifications.map((notif) => {
              const isProspectNotif = notif.type === 'prospect' || notif.type === 'meeting'
              const NotifContent = (
                <div
                  className={`p-3 rounded-lg border ${
                    notif.is_read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  } ${isProspectNotif ? 'cursor-pointer hover:bg-primary/10' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          notif.priority === 'urgent' ? 'destructive' :
                          notif.priority === 'high' ? 'default' : 'secondary'
                        } className="text-xs">
                          {notif.type === 'prospect' ? 'Prospecto' : 
                           notif.type === 'meeting' ? 'Reunión' : notif.type}
                        </Badge>
                        {!notif.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm">{notif.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                    {!notif.is_read && !isProspectNotif && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )

              return isProspectNotif && notif.link ? (
                <Link key={notif.id} href={notif.link}>
                  {NotifContent}
                </Link>
              ) : (
                <div key={notif.id}>
                  {NotifContent}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}