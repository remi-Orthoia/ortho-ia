'use client'

import type { ChangeEvent, CSSProperties, ReactNode, TextareaHTMLAttributes, InputHTMLAttributes, Ref } from 'react'
import { forwardRef } from 'react'

interface BaseProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Wrapper className — pour layout / espacement extérieur. */
  wrapperClassName?: string
  wrapperStyle?: CSSProperties
}

type InputProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  multiline?: false
}
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & {
  multiline: true
}

export type AppInputProps = InputProps | TextareaProps

const fieldStyle = (hasError: boolean): CSSProperties => ({
  width: '100%', padding: '10px 12px',
  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.45,
  background: 'var(--bg-surface)', color: 'var(--fg-1)',
  border: '1px solid ' + (hasError ? 'var(--ds-danger)' : 'var(--border-ds-strong)'),
  borderRadius: 10, outline: 'none',
})

const AppInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, AppInputProps>(
  function AppInput(props, ref) {
    const { label, hint, error, wrapperClassName, wrapperStyle } = props
    const hasError = !!error

    return (
      <div className={wrapperClassName} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapperStyle }}>
        {label && (
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>{label}</label>
        )}
        {props.multiline ? (
          <textarea
            ref={ref as Ref<HTMLTextAreaElement>}
            {...(props as TextareaProps)}
            style={{ ...fieldStyle(hasError), resize: 'vertical', ...(props as TextareaProps).style }}
          />
        ) : (
          <input
            ref={ref as Ref<HTMLInputElement>}
            {...(props as InputProps)}
            style={{ ...fieldStyle(hasError), ...(props as InputProps).style }}
          />
        )}
        {hint && !error && <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span>}
        {error && <span style={{ fontSize: 12, color: 'var(--ds-danger)' }}>{error}</span>}
      </div>
    )
  }
)

export default AppInput
export type { ChangeEvent }
