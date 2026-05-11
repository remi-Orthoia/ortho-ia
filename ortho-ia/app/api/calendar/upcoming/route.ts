import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  getValidAccessToken,
  fetchUpcomingEvents,
  isGoogleCalendarConfigured,
  type CalendarEvent,
} from '@/lib/google-calendar'
import { logger } from '@/lib/logger'

/**
 * GET /api/calendar/upcoming
 * Renvoie les prochains événements du calendrier de l'utilisateur·rice,
 * matchés avec les patients de son carnet.
 *
 * Format réponse :
 *   {
 *     connected: true,
 *     events: [{ id, summary, start, end, matchedPatient: { id, prenom, nom } | null }, ...]
 *   }
 *
 *   ou si non connecté :
 *   { connected: false }
 */

interface MatchedEvent extends CalendarEvent {
  matchedPatient: { id: string; prenom: string; nom: string } | null
}

/**
 * Strip accents + lowercase. Pour matcher "Léa" avec "Lea" dans le titre
 * d'un événement saisi sans accents.
 */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/**
 * Match d'un titre d'event vers un patient du carnet.
 * Heuristique simple : si le titre contient le prénom ET le nom (ou juste
 * le prénom si unique dans le carnet), c'est un match.
 */
function findMatchedPatient(
  eventSummary: string,
  patients: Array<{ id: string; prenom: string; nom: string }>,
): { id: string; prenom: string; nom: string } | null {
  const titleNorm = normalize(eventSummary)
  if (!titleNorm) return null
  // Match exact prénom + nom
  for (const p of patients) {
    const fullName = normalize(`${p.prenom} ${p.nom}`)
    if (titleNorm.includes(fullName)) return p
  }
  // Match prénom seul si unique
  for (const p of patients) {
    const prenom = normalize(p.prenom)
    if (prenom.length < 3) continue // évite des matches sur "Léa" ↔ "Léon"
    if (titleNorm.includes(prenom)) {
      // Vérifie l'unicité : pas d'autre patient avec le même prénom
      const others = patients.filter(o => o.id !== p.id && normalize(o.prenom) === prenom)
      if (others.length === 0) return p
    }
  }
  return null
}

export async function GET(_request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({ connected: false, configured: false })
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  let accessToken: string | null = null
  try {
    accessToken = await getValidAccessToken(user.id)
  } catch (err) {
    logger.error('calendar-upcoming-token', err)
    return NextResponse.json({ connected: false, configured: true })
  }

  if (!accessToken) {
    return NextResponse.json({ connected: false, configured: true })
  }

  const [eventsResult, patientsResult] = await Promise.all([
    fetchUpcomingEvents(accessToken, { hours: 24 }).catch((err) => {
      logger.error('calendar-upcoming-fetch', err)
      return [] as CalendarEvent[]
    }),
    supabase.from('patients').select('id, prenom, nom').eq('user_id', user.id),
  ])

  const patients = (patientsResult.data ?? []) as Array<{ id: string; prenom: string; nom: string }>
  const events: MatchedEvent[] = eventsResult.map((e) => ({
    ...e,
    matchedPatient: findMatchedPatient(e.summary, patients),
  }))

  return NextResponse.json({ connected: true, configured: true, events })
}
