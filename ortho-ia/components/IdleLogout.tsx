'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/**
 * Auto-deconnexion apres inactivite (60 min par defaut).
 *
 * Contexte : cabinet partage ou poste de travail laisse ouvert pendant une
 * pause. Le secret medical impose de ne pas laisser un dashboard avec donnees
 * patient accessible a un tiers (autre ortho, agent d'entretien, etc.).
 *
 * Logique :
 *  - Tracke activite utilisateur (mousemove, keydown, click, touchstart,
 *    scroll). Throttled a 1 event/seconde max pour eviter de re-render.
 *  - Apres IDLE_MS d'inactivite, affiche un overlay "Reconnexion dans Xs"
 *    avec un bouton "Rester connectee" qui reset le timer.
 *  - Apres WARNING_MS supplementaires sans clic, signOut() + redirect /.
 *
 * Persistance : timer est local au composant, pas synchronise entre onglets.
 * Si l'ortho a 3 onglets ouverts et bouge la souris sur 1, le timer reset
 * partout via 'storage' event sur localStorage (last-activity-at).
 *
 * Disabled en dev par defaut (NEXT_PUBLIC_DISABLE_IDLE_LOGOUT=1) pour
 * eviter de couper Cursor / Claude pendant qu'on code.
 */

const IDLE_MS = 60 * 60 * 1000        // 60 min sans activite → warning
const WARNING_MS = 2 * 60 * 1000      // 2 min de warning → logout
const LS_KEY = 'orthoia.last-activity-at'
const THROTTLE_MS = 1000              // ne tracke pas plus d'1 event/seconde

export default function IdleLogout() {
  const router = useRouter()
  const [warningOpen, setWarningOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARNING_MS / 1000)
  const lastActivityRef = useRef<number>(Date.now())
  const lastWriteRef = useRef<number>(0)

  // Stop si l'env explicite veut desactiver (dev local).
  const disabled = typeof window !== 'undefined'
    && process.env.NEXT_PUBLIC_DISABLE_IDLE_LOGOUT === '1'

  useEffect(() => {
    if (disabled) return

    const bumpActivity = () => {
      const now = Date.now()
      lastActivityRef.current = now
      // Sync cross-onglets : on ecrit dans localStorage au max toutes les
      // THROTTLE_MS pour ne pas spammer le storage event listener.
      if (now - lastWriteRef.current > THROTTLE_MS) {
        lastWriteRef.current = now
        try { localStorage.setItem(LS_KEY, String(now)) } catch {}
      }
      // Si on etait en warning, l'activite annule.
      if (warningOpen) {
        setWarningOpen(false)
        setSecondsLeft(WARNING_MS / 1000)
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) {
        const ts = Number(e.newValue)
        if (!isNaN(ts) && ts > lastActivityRef.current) {
          lastActivityRef.current = ts
          if (warningOpen) {
            setWarningOpen(false)
            setSecondsLeft(WARNING_MS / 1000)
          }
        }
      }
    }

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const
    events.forEach(ev => window.addEventListener(ev, bumpActivity, { passive: true }))
    window.addEventListener('storage', onStorage)

    // Init : pose le timestamp courant pour aligner cross-onglets a l'ouverture.
    try {
      const stored = Number(localStorage.getItem(LS_KEY) || '0')
      if (stored > 0) lastActivityRef.current = stored
      else localStorage.setItem(LS_KEY, String(Date.now()))
    } catch {}

    // Tick toutes les 10s — pas besoin de precision sub-seconde pour 60 min.
    const idleCheckId = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current
      if (!warningOpen && idleFor >= IDLE_MS) {
        setWarningOpen(true)
        setSecondsLeft(WARNING_MS / 1000)
      }
    }, 10_000)

    return () => {
      events.forEach(ev => window.removeEventListener(ev, bumpActivity))
      window.removeEventListener('storage', onStorage)
      clearInterval(idleCheckId)
    }
  }, [warningOpen, disabled])

  // Compte a rebours pendant le warning (1s tick precise).
  useEffect(() => {
    if (!warningOpen) return
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id)
          performLogout()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warningOpen])

  const performLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    try { localStorage.removeItem(LS_KEY) } catch {}
    router.push('/?logged-out=idle')
  }

  const stayConnected = () => {
    const now = Date.now()
    lastActivityRef.current = now
    try { localStorage.setItem(LS_KEY, String(now)) } catch {}
    setWarningOpen(false)
    setSecondsLeft(WARNING_MS / 1000)
  }

  if (!warningOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        display: 'grid', placeItems: 'center', padding: 24,
      }}
    >
      <div style={{
        background: 'var(--bg-surface, #fff)',
        borderRadius: 16,
        padding: '32px 28px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22, fontWeight: 500,
          margin: '0 0 12px',
          color: 'var(--fg-1, #1F2A2A)',
        }}>
          Toujours la ?
        </h2>
        <p style={{
          fontSize: 14, color: 'var(--fg-2, #4B5563)',
          margin: '0 0 24px', lineHeight: 1.5,
        }}>
          Vous serez deconnectee dans <strong>{secondsLeft}s</strong> par securite (donnees patients).
          Cliquez ci-dessous pour rester connectee.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={performLogout}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: 'transparent', border: '1px solid #D1D5DB',
              color: 'var(--fg-2, #4B5563)', fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Me deconnecter
          </button>
          <button
            type="button"
            onClick={stayConnected}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: 'var(--ds-primary, #3F5E52)', border: 0,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Rester connectee
          </button>
        </div>
      </div>
    </div>
  )
}
