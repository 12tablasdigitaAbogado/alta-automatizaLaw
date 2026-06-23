import { useEffect } from 'react'

const GHL_SCRIPT_SRC = 'https://link.msgsndr.com/js/form_embed.js'

export default function TestGHL() {
  useEffect(() => {
    if (document.querySelector(`script[src="${GHL_SCRIPT_SRC}"]`)) return
    const s = document.createElement('script')
    s.src = GHL_SCRIPT_SRC
    s.async = true
    document.body.appendChild(s)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-12">
        <header>
          <h1 className="text-2xl font-semibold">Test GHL embeds</h1>
          <p className="text-text-muted text-sm mt-1">
            Ruta temporal para verificar el formulario y el calendario de GoHighLevel.
          </p>
        </header>

        <section>
          <h2 className="text-lg font-medium mb-3">Formulario — Lista de espera Agentes</h2>
          <div className="bg-bg-2 border border-border rounded-xl">
            <iframe
              src="https://api.leadconnectorhq.com/widget/form/r6H5PT5aGzfofYhDjDRz"
              style={{ width: '100%', height: 2400, border: 'none', borderRadius: 8, display: 'block' }}
              id="inline-r6H5PT5aGzfofYhDjDRz"
              data-layout='{"id":"INLINE"}'
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Lista de espera Agentes"
              data-height="2158"
              data-layout-iframe-id="inline-r6H5PT5aGzfofYhDjDRz"
              data-form-id="r6H5PT5aGzfofYhDjDRz"
              title="Lista de espera Agentes"
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Calendario — Booking</h2>
          <div className="bg-bg-2 border border-border rounded-xl overflow-hidden" style={{ minHeight: 700 }}>
            <iframe
              src="https://api.leadconnectorhq.com/widget/booking/MCiMeiA5XZrpfOh7XCSX"
              style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: 700 }}
              scrolling="no"
              id="MCiMeiA5XZrpfOh7XCSX_1782167462653"
              title="Calendario GHL"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
