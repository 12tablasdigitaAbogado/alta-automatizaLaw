import { useEffect } from 'react'

const GHL_SCRIPT_SRC = 'https://link.msgsndr.com/js/form_embed.js'
const FORM_ID = 'r6H5PT5aGzfofYhDjDRz'

export function GhlForm() {
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
        src={`https://api.leadconnectorhq.com/widget/form/${FORM_ID}`}
        style={{ width: '100%', height: 2400, border: 'none', display: 'block' }}
        id={`inline-${FORM_ID}`}
        data-layout='{"id":"INLINE"}'
        data-trigger-type="alwaysShow"
        data-trigger-value=""
        data-activation-type="alwaysActivated"
        data-activation-value=""
        data-deactivation-type="neverDeactivate"
        data-deactivation-value=""
        data-form-name="Lista de espera Agentes"
        data-height="2158"
        data-layout-iframe-id={`inline-${FORM_ID}`}
        data-form-id={FORM_ID}
        title="Lista de espera Agentes"
      />
    </div>
  )
}
