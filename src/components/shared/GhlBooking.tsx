import { useEffect, useMemo } from 'react'

const GHL_SCRIPT_SRC = 'https://link.msgsndr.com/js/form_embed.js'
const BOOKING_ID = 'MCiMeiA5XZrpfOh7XCSX'

export function GhlBooking() {
  const iframeId = useMemo(() => `${BOOKING_ID}_${Date.now()}`, [])

  useEffect(() => {
    if (document.querySelector(`script[src="${GHL_SCRIPT_SRC}"]`)) return
    const s = document.createElement('script')
    s.src = GHL_SCRIPT_SRC
    s.async = true
    document.body.appendChild(s)
  }, [])

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-bg-card border border-border">
      <iframe
        src={`https://api.leadconnectorhq.com/widget/booking/${BOOKING_ID}`}
        style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: 1100, display: 'block' }}
        scrolling="no"
        id={iframeId}
        title="Agendar reunión de alta"
      />
    </div>
  )
}
