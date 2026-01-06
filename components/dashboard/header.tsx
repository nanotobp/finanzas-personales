'use client'
import { RefreshCw } from 'lucide-react'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogOut, User, Search, Bell, Moon, Sun, TrendingDown, TrendingUp, Wallet, CreditCard, Users } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSidebarPreferences, colorGradients } from '@/hooks/use-sidebar-preferences'
import { cn, formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface HeaderProps {
  user: {
    email?: string
  }
}

interface SearchResult {
  id: string
  type: 'transaction' | 'account' | 'card' | 'client'
  title: string
  subtitle: string
  amount?: number
  icon: any
  href: string
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { isCollapsed, color } = useSidebarPreferences()
  const gradient = colorGradients[color as keyof typeof colorGradients] || colorGradients.violet
  const supabase = createClient()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const searchGlobal = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results: SearchResult[] = []

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar en transacciones
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, description, amount, type, date')
        .eq('user_id', user.id)
        .ilike('description', `%${searchQuery}%`)
        .limit(5)

      transactions?.forEach(t => {
        results.push({
          id: t.id,
          type: 'transaction',
          title: t.description,
          subtitle: new Date(t.date).toLocaleDateString('es-PY'),
          amount: t.amount,
          icon: t.type === 'income' ? TrendingUp : TrendingDown,
          href: '/activity'
        })
      })

      // Buscar en cuentas
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name, balance, type')
        .eq('user_id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .limit(5)

      accounts?.forEach(a => {
        results.push({
          id: a.id,
          type: 'account',
          title: a.name,
          subtitle: `Saldo: ${formatCurrency(a.balance)}`,
          icon: Wallet,
          href: '/accounts'
        })
      })

      // Buscar en tarjetas
      const { data: cards } = await supabase
        .from('cards')
        .select('id, name, last_four, balance')
        .eq('user_id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .limit(5)

      cards?.forEach(c => {
        results.push({
          id: c.id,
          type: 'card',
          title: c.name,
          subtitle: `**** ${c.last_four}`,
          icon: CreditCard,
          href: '/cards'
        })
      })

      // Buscar en clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, type')
        .eq('user_id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .limit(5)

      clients?.forEach(c => {
        results.push({
          id: c.id,
          type: 'client',
          title: c.name,
          subtitle: c.email || (c.type === 'fixed' ? 'Cliente Fijo' : 'Cliente Ocasional'),
          icon: Users,
          href: '/clients'
        })
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Error en búsqueda:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchGlobal()
      setSearchOpen(true)
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.href)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-all duration-300",
      isCollapsed ? "md:left-20" : "md:left-64"
    )}>
      <div className="flex h-[88px] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center justify-between gap-4">
          {/* Search Bar - Búsqueda con Enter */}
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
                <Input
                  type="search"
                  placeholder="Buscar transacciones, cuentas... (Enter para buscar)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-9 pr-4 bg-card border-0 shadow-sm rounded-full h-11 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandList>
                  {isSearching && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Buscando...
                    </div>
                  )}
                  {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                  )}
                  {!isSearching && searchResults.length === 0 && searchQuery.length < 2 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Escribe al menos 2 caracteres para buscar
                    </div>
                  )}
                  {!isSearching && searchResults.length > 0 && (
                    <>
                      {['transaction', 'account', 'card', 'client'].map(type => {
                        const items = searchResults.filter(r => r.type === type)
                        if (items.length === 0) return null

                        const typeLabels = {
                          transaction: 'Transacciones',
                          account: 'Cuentas',
                          card: 'Tarjetas',
                          client: 'Clientes'
                        }

                        return (
                          <CommandGroup key={type} heading={typeLabels[type as keyof typeof typeLabels]}>
                            {items.map(result => (
                              <CommandItem
                                key={result.id}
                                onSelect={() => handleSelectResult(result)}
                                className="flex items-center gap-3 cursor-pointer"
                              >
                                <result.icon className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">{result.title}</div>
                                  <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                                </div>
                                {result.amount && (
                                  <div className={cn(
                                    "font-semibold text-sm",
                                    result.type === 'transaction' && result.icon === TrendingUp
                                      ? "text-green-600"
                                      : "text-red-600"
                                  )}>
                                    {formatCurrency(result.amount)}
                                  </div>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )
                      })}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-full px-2 sm:px-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r",
                    gradient
                  )}>
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium hidden lg:inline truncate max-w-[120px]">
                    Giovanni Patrón
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Recargar la página para actualizar datos
                  window.location.reload()
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar datos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
