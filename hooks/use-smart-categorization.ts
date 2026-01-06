'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Simple keyword-based categorization (ML simplificado)
const categoryKeywords = {
  'Alimentación': ['super', 'mercado', 'comida', 'restaurante', 'delivery', 'rappi', 'pedidosya', 'uber eats'],
  'Transporte': ['uber', 'taxi', 'gasolina', 'combustible', 'estacionamiento', 'peaje', 'bus', 'metro'],
  'Servicios': ['luz', 'agua', 'internet', 'telefono', 'netflix', 'spotify', 'gym', 'gimnasio'],
  'Salud': ['farmacia', 'doctor', 'hospital', 'clinica', 'medicamento', 'consulta'],
  'Entretenimiento': ['cine', 'teatro', 'concierto', 'bar', 'disco', 'juego'],
  'Ropa': ['ropa', 'zapateria', 'moda', 'boutique'],
  'Educación': ['libro', 'curso', 'universidad', 'colegio', 'capacitacion']
}

export function useSmartCategorization() {
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const suggestCategory = async (description: string): Promise<{ categoryId: string | null, confidence: number }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { categoryId: null, confidence: 0 }

    const descLower = description.toLowerCase()

    // 1. Buscar en patrones aprendidos del usuario
    const { data: patterns } = await supabase
      .from('transaction_patterns')
      .select('suggested_category_id, confidence')
      .eq('user_id', user.id)
      .ilike('description_pattern', `%${descLower}%`)
      .order('times_used', { ascending: false })
      .limit(1)
      .single()

    if (patterns && patterns.confidence > 0.8) {
      return {
        categoryId: patterns.suggested_category_id,
        confidence: patterns.confidence
      }
    }

    // 2. Buscar en keywords predefinidos
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)

    if (!categories) return { categoryId: null, confidence: 0 }

    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          const category = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()))
          if (category) {
            // Guardar patrón para aprendizaje
            await supabase
              .from('transaction_patterns')
              .upsert({
                user_id: user.id,
                description_pattern: descLower,
                suggested_category_id: category.id,
                confidence: 0.75,
                times_used: 1
              })

            return { categoryId: category.id, confidence: 0.75 }
          }
        }
      }
    }

    return { categoryId: null, confidence: 0 }
  }

  const confirmCategorization = useMutation({
    mutationFn: async ({ transactionId, categoryId }: { transactionId: string, categoryId: string }) => {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('description')
        .eq('id', transactionId)
        .single()

      if (transaction) {
        // Actualizar o crear patrón con mayor confianza
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('transaction_patterns')
            .upsert({
              user_id: user.id,
              description_pattern: transaction.description.toLowerCase(),
              suggested_category_id: categoryId,
              confidence: 0.95,
              times_used: 1
            })

          // Guardar en datos de entrenamiento
          await supabase
            .from('category_training_data')
            .insert({
              description: transaction.description,
              category_id: categoryId,
              user_confirmed: true
            })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-patterns'] })
      toast({
        title: '✅ Patrón Aprendido',
        description: 'La IA mejorará sus sugerencias futuras'
      })
    }
  })

  return { suggestCategory, confirmCategorization }
}