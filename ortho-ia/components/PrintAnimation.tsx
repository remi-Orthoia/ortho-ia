'use client'

/**
 * Overlay 3D flip animation pendant la génération + download d'un Word.
 *
 * 800ms-1500ms de poésie : 3 "pages" stylisées qui flippent en cascade
 * façon imprimante, légende "Génération du Word…" qui devient "Téléchargé !"
 * en fin. Détail satisfaisant qui transforme l'attente (1-2s de génération
 * docx + canvas chart) en moment fluide.
 *
 * Trigger : attribut body[data-print-animation="true"] piloté par
 *   playPrintAnimation(ms?).
 *
 * Le composant est mounté UNE FOIS au layout dashboard et observe l'attribut.
 *
 * Usage :
 *   import { playPrintAnimation } from '@/components/PrintAnimation'
 *   const wrappedDownload = async () => {
 *     playPrintAnimation(1500)
 *     await downloadCRBOWord({...})
 *   }
 */

import { useEffect, useState } from 'react'
import { FileText, Check } from 'lucide-react'

const ATTR = 'data-print-animation'

let activeTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Déclenche l'overlay pour `durationMs` (défaut 1500ms).
 * Si déjà actif, prolonge la durée (ne reset pas l'animation).
 *
 * À appeler AVANT le download — l'animation tourne en parallèle pendant
 * la génération docx. La promise du download peut être plus rapide ou
 * plus lente que l'animation, peu importe : on garantit minimum 1.5s
 * de visuel pour que l'animation soit vue.
 */
export function playPrintAnimation(durationMs: number = 1500) {
  if (typeof document === 'undefined') return
  document.body.setAttribute(ATTR, 'true')
  if (activeTimeout) clearTimeout(activeTimeout)
  activeTimeout = setTimeout(() => {
    document.body.removeAttribute(ATTR)
    activeTimeout = null
  }, durationMs)
}

/**
 * Composant à monter dans le layout : observe body[data-print-animation]
 * et affiche l'overlay quand actif. Animation purement CSS — pas de
 * dépendance runtime.
 */
export default function PrintAnimation() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const updateFromAttr = () => {
      setVisible(document.body.getAttribute(ATTR) === 'true')
    }
    updateFromAttr()
    // MutationObserver pour détecter les changements de l'attribut (cf.
    // playPrintAnimation qui set/unset). Léger : 1 attribut sur 1 élément.
    const observer = new MutationObserver(updateFromAttr)
    observer.observe(document.body, { attributes: true, attributeFilter: [ATTR] })
    return () => observer.disconnect()
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Génération du document Word en cours"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        animation: 'print-overlay-in 220ms ease-out',
      }}
    >
      {/* Stack 3D : 3 pages qui flippent en cascade, perspective fixée
          sur le wrapper pour que les transforms 3D soient cohérents. */}
      <div
        style={{
          perspective: '1200px',
          width: 200,
          height: 260,
          position: 'relative',
        }}
      >
        <PrintPage delay={0}    />
        <PrintPage delay={0.15} />
        <PrintPage delay={0.30} />
        <PrintPage delay={0.45} isLast />
      </div>

      <div
        style={{
          color: 'white',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: 0.2,
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span className="print-anim-label">Génération du Word…</span>
      </div>

      {/* Animations CSS globales — déclarées une seule fois */}
      <style jsx global>{`
        @keyframes print-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes print-page-flip {
          0%   { transform: translateZ(0) rotateY(0deg); opacity: 1; }
          50%  { transform: translateZ(20px) rotateY(-90deg); opacity: 0.7; }
          100% { transform: translateZ(0) rotateY(0deg); opacity: 1; }
        }
        @keyframes print-page-stack {
          0%   { transform: translateY(0) translateZ(0) rotateY(0deg); }
          40%  { transform: translateY(-12px) translateZ(40px) rotateY(-25deg); opacity: 1; }
          85%  { transform: translateY(-8px) translateZ(20px) rotateY(-12deg); opacity: 0.6; }
          100% { transform: translateY(0) translateZ(0) rotateY(0deg); opacity: 1; }
        }
        @keyframes print-page-check {
          0%, 70% { transform: scale(0); opacity: 0; }
          85%     { transform: scale(1.1); opacity: 1; }
          100%    { transform: scale(1); opacity: 1; }
        }
        @keyframes print-anim-label {
          0%, 60% { opacity: 1; }
          70%     { opacity: 0; }
          100%    { opacity: 1; }
        }
        .print-anim-page {
          position: absolute;
          inset: 0;
          background: white;
          border-radius: 6px;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.10),
            0 4px 12px rgba(0,0,0,0.20);
          transform-style: preserve-3d;
          transform-origin: left center;
          animation: print-page-stack 1.5s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        /* Effet "feuille avec contenu" : quelques lignes grises +
           un bandeau vert en haut (rappelle le filigrane des CRBO). */
        .print-anim-page::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 24px;
          background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
          border-radius: 6px 6px 0 0;
        }
        .print-anim-page::after {
          content: '';
          position: absolute;
          top: 40px; left: 16px; right: 16px; bottom: 24px;
          background:
            linear-gradient(to bottom,
              #E5E7EB 0, #E5E7EB 2px, transparent 2px, transparent 12px,
              #E5E7EB 12px, #E5E7EB 14px, transparent 14px, transparent 24px,
              #E5E7EB 24px, #E5E7EB 26px, transparent 26px, transparent 36px,
              #E5E7EB 36px, #E5E7EB 38px, transparent 38px, transparent 48px,
              #E5E7EB 48px, #E5E7EB 50px, transparent 50px, transparent 60px,
              #E5E7EB 60px, #E5E7EB 62px, transparent 62px, transparent 72px,
              #E5E7EB 72px, #E5E7EB 74px, transparent 74px
            );
          background-size: 100% 84px;
        }
        .print-anim-page-last {
          animation: none;
          opacity: 1;
        }
        .print-anim-check {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
          animation: print-page-check 1.5s ease-out forwards;
        }
        .print-anim-label {
          animation: print-anim-label 1.5s ease-out;
        }
      `}</style>
    </div>
  )
}

function PrintPage({ delay, isLast }: { delay: number; isLast?: boolean }) {
  return (
    <div
      className={`print-anim-page ${isLast ? 'print-anim-page-last' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {isLast && (
        <div className="print-anim-check">
          <Check size={56} strokeWidth={3.5} />
        </div>
      )}
    </div>
  )
}
