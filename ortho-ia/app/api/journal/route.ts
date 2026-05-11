import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

/**
 * GET  /api/journal — liste les entrées du carnet (antéchronologique)
 * POST /api/journal — crée une entrée  { body, category? }
 */

const MAX_BODY = 10_000
const VALID_CATEGORIES = ['observation', 'idee', 'rappel', 'formation', 'autre'] as const

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })

  // Pagination simple : limit + cursor (created_at)
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 50) || 50, 200)
  const before = request.nextUrl.searchParams.get('before') // ISO timestamp

  let query = supabase
    .from('session_journal')
    .select('id, body, category, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) query = query.lt('created_at', before)

  const { data, error } = await query
  if (error) {
    logger.error('journal-list', error)
    return NextResponse.json({ error: 'Erreur lecture journal' }, { status: 500 })
  }
  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }
  const text = typeof (body as any)?.body === 'string' ? (body as any).body.trim() : ''
  const rawCategory = (body as any)?.category
  const category = typeof rawCategory === 'string' && (VALID_CATEGORIES as readonly string[]).includes(rawCategory)
    ? rawCategory
    : null

  if (!text) return NextResponse.json({ error: 'Contenu manquant' }, { status: 400 })
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: `Entrée trop longue (max ${MAX_BODY} caractères)` }, { status: 400 })
  }

  const { data: created, error } = await supabase
    .from('session_journal')
    .insert({ user_id: user.id, body: text, category })
    .select('id, body, category, created_at, updated_at')
    .single()

  if (error || !created) {
    logger.error('journal-create', error)
    return NextResponse.json({ error: "Erreur lors de la création de l'entrée" }, { status: 500 })
  }

  return NextResponse.json({ entry: created }, { status: 201 })
}
