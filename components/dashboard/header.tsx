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
      "fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300",
      "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl",
      "supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60",
      isCollapsed ? "md:left-20" : "md:left-64"
    )}>
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8 gap-4">
        <div className="flex flex-1 items-center justify-between gap-4">
          {/* Search Bar */}
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="search"
                  placeholder="Buscar... (Enter para buscar)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-4 bg-muted/50 border-0 rounded-lg h-10 focus-visible:ring-2 focus-visible:ring-primary/20"
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 rounded-lg px-2 h-9">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                    gradient
                  )}>
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-medium hidden lg:inline truncate max-w-[120px] text-sm">
                    Giovanni Patrón
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Giovanni Patrón</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/user-profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar datos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
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
