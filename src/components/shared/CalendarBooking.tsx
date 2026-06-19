import { useEffect, useRef } from 'react'

const CALENDLY_URL =
  'https://calendly.com/jorgedujedev/alta-agente?hide_event_type_details=1&hide_gdpr_banner=1'

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: { url: string; parentElement: Element | null }) => void
    }
  }
}

export function CalendarBooking() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = () => {
      if (ref.current) {
        ref.current.innerHTML = ''
        window.Calendly?.initInlineWidget({ url: CALENDLY_URL, parentElement: ref.current })
      }
    }

    if (window.Calendly) {
      init()
    } else {
      const existing = document.querySelector('script[src*="calendly"]')
      if (existing) {
        existing.addEventListener('load', init, { once: true })
      } else {
        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        script.async = true
        script.onload = init
        document.head.appendChild(script)
      }
    }
  }, [])

  return (
    <div
      ref={ref}
      className="w-full rounded-2xl overflow-hidden"
      style={{ minWidth: '320px', height: 'min(700px, 80vh)' }}
    />
  )
}
