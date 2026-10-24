import React from 'react'

export type ClinicalRecordPdfProps = {
  patientName: string
  patientDni?: string
  professionalName: string
  professionalLicense: string
  requestedAt: string
  fulfilledAt: string
  entries: {
    id: string
    kind: string
    content: string
    createdAt: string
    contentHash: string
    licenseSnapshot: string
  }[]
}

export function ClinicalRecordDocument({
  patientName,
  patientDni,
  professionalName,
  professionalLicense,
  requestedAt,
  fulfilledAt,
  entries,
}: ClinicalRecordPdfProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans print:p-0">
      <header className="border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">PUENTE — Copia de Historia Clínica</h1>
        <p className="text-xs text-slate-500 mt-1">
          Expedida conforme a la Ley 26.529 de Derechos del Paciente (Art. 14)
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 text-xs mb-6 border-b border-slate-200 pb-4">
        <div>
          <p><span className="font-semibold">Titular / Paciente:</span> {patientName}</p>
          {patientDni && <p><span className="font-semibold">DNI:</span> {patientDni}</p>}
          <p><span className="font-semibold">Fecha de solicitud:</span> {requestedAt}</p>
        </div>
        <div>
          <p><span className="font-semibold">Profesional tratante:</span> {professionalName}</p>
          <p><span className="font-semibold">Matrícula vigente:</span> {professionalLicense}</p>
          <p><span className="font-semibold">Fecha de emisión:</span> {fulfilledAt}</p>
        </div>
      </section>

      <main className="flex flex-col gap-6 mb-12">
        <h2 className="text-base font-semibold border-b border-slate-200 pb-2">Asientos Registrados</h2>
        {entries.map((e, idx) => (
          <div key={e.id} className="border border-slate-200 rounded p-4 text-xs">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-700">
                #{idx + 1} {e.kind}
              </span>
              <span>{e.createdAt} · Matrícula: {e.licenseSnapshot}</span>
            </div>
            <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed mb-3">
              {e.content}
            </p>
            <div className="text-[10px] text-slate-400 font-mono">
              Firma digital (SHA-256): {e.contentHash}
            </div>
          </div>
        ))}
      </main>

      <footer className="border-t border-slate-300 pt-6 mt-12 flex justify-between items-end text-xs text-slate-500">
        <div>
          <p>Copia fiel de las constancias digitales obrantes en la plataforma.</p>
          <p>Inmutabilidad garantizada por función hash criptográfica.</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-slate-400 mb-1" />
          <p className="font-medium text-slate-800">{professionalName}</p>
          <p>{professionalLicense}</p>
        </div>
      </footer>
    </div>
  )
}
