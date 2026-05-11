'use client'

/**
 * Widget dashboard : prochains RDV Google Calendar + bouton "Démarrer le CRBO".
 *
 * États affichés :
 *   - configuré=false (env vars Google manquantes côté serveur) : RIEN affiché
 *     — pas la peine d'inviter l'ortho à connecter si l'admin n'a pas configuré
 *   - configuré=true & connecté=false : CTA "Connecter mon agenda Google"
 *   - connecté=true & events=[] : "Aucun RDV dans les 24h"
 *   - connecté=true & events>0 : liste des RDV, bouton "Démarrer le CRBO"
 *     sur ceux qui matchent un patient du carnet
 *
 * Pourquoi : pré-remplit le CRBO depuis le RDV au lieu de re-saisir le patient
 * chaque fois. Effet "wow" : l'app sait qui est le prochain patient sans
 * que l'ortho ait à le dire.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Calendar, Clock, ExternalLink, Loader2, Plus, X, Sparkles } from 'lucide-react'
import { useToast } from './Toast'

interface CalendarEventDTO {
  id: string
  summary: string
  start: string
  end: string
  matchedPatient: { id: string; prenom: string; nom: string } | null
}

interface ApiResponse {
  connected: boolean
  configured?: boolean
  events?: CalendarEventDTO[]
}

export default function CalendarWidget() {
  const toast = useToast()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'loading' | 'not-configured' | 'not-connected' | 'connected' | 'error'>('loading')
  const [events, setEvents] = useState<CalendarEventDTO[]>([])

  const fetchData = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/calendar/upcoming')
      const data = (await res.json()) as ApiResponse
      if (data.configured === false) {
        setState('not-configured')
        return
      }
      if (!data.connected) {
        setState('not-connected')
        return
      }
      setEvents(data.events ?? [])
      setState('connected')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Toast feedback sur retour OAuth
  useEffect(() => {
    const calendarParam = searchParams.get('calendar')
    if (!calendarParam) return
    if (calendarParam === 'connected') {
      toast.success('✅ Agenda Google connecté — vos prochains RDV apparaissent ci-dessous.')
      fetchData()
    } else if (calendarParam === 'denied') {
      toast.info('Connexion Google Calendar annulée.')
    } else if (calendarParam === 'error' || calendarParam === 'storage_error') {
      toast.error('Connexion Google Calendar échouée. Réessayez.')
    }
    // Nettoie le param d'URL après affichage
    const url = new URL(window.location.href)
    url.searchParams.delete('calendar')
    window.history.replaceState(null, '', url.toString())
  }, [searchParams, toast])

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter votre agenda Google ? Vos tokens seront révoqués.')) return
    try {
      await fetch('/api/calendar/disconnect', { method: 'POST' })
      toast.success('Agenda Google déconnecté.')
      setState('not-connected')
      setEvents([])
    } catch {
      toast.error('Erreur lors de la déconnexion.')
    }
  }

  // Pas configuré côté serveur (env vars manquantes) → on n'affiche RIEN
  if (state === 'not-configured') return null

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }
  const isToday = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }
  const formatDateChip = (iso: string) => {
    const d = new Date(iso)
    if (isToday(iso)) return "Aujourd'hui"
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-ds)',
        borderRadius: 16,
        padding: '20px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={16} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--fg-1)' }}>
            Prochains RDV
          </h3>
        </div>
        {state === 'connected' && (
          <button
            onClick={handleDisconnect}
            title="Déconnecter l'agenda Google"
            style={{
              background: 'transparent', border: 0, cursor: 'pointer',
              color: 'var(--fg-3)', padding: 4, borderRadius: 4,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 size={14} className="animate-spin" />
          Chargement de l'agenda…
        </div>
      )}

      {state === 'not-connected' && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 12 }}>
            Connectez votre agenda Google pour pré-remplir automatiquement le CRBO
            depuis le prochain RDV (matching par prénom du patient).
          </p>
          <a
            href="/api/calendar/connect"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Connecter mon agenda Google
          </a>
        </div>
      )}

      {state === 'error' && (
        <p style={{ fontSize: 13, color: 'var(--ds-danger)' }}>
          Impossible de charger l'agenda. Réessayez plus tard.
        </p>
      )}

      {state === 'connected' && events.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic', padding: '8px 0' }}>
          Aucun rendez-vous dans les 24 prochaines heures.
        </p>
      )}

      {state === 'connected' && events.length > 0 && (
        <div className="space-y-2">
          {events.slice(0, 4).map((e) => (
            <div
              key={e.id}
              style={{
                background: 'var(--bg-surface-2)',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-1)', fontWeight: 600 }}>
                  <Clock size={11} style={{ color: 'var(--fg-3)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-primary-hover, #16a34a)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {formatDateChip(e.start)} {formatTime(e.start)}
                  </span>
                </div>
                <p style={{ margin: 0, marginTop: 3, fontSize: 14, color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.summary}
                </p>
                {e.matchedPatient && (
                  <p style={{ margin: 0, marginTop: 2, fontSize: 11, color: 'var(--fg-3)' }}>
                    🔗 Patient du carnet : <strong>{e.matchedPatient.prenom} {e.matchedPatient.nom}</strong>
                  </p>
                )}
              </div>
              {e.matchedPatient ? (
                <Link
                  href={`/dashboard/nouveau-crbo?patient=${e.matchedPatient.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px',
                    background: 'var(--ds-primary)',
                    color: 'white',
                    borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={12} />
                  Démarrer
                </Link>
              ) : (
                <Link
                  href="/dashboard/nouveau-crbo"
                  title="Patient non trouvé dans le carnet — créer un CRBO vierge"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '6px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-ds-strong)',
                    color: 'var(--fg-2)',
                    borderRadius: 8,
                    fontSize: 12, fontWeight: 500,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={11} />
                  Nouveau
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
