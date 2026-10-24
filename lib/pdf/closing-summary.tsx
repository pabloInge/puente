import React from 'react'

export type ClosingSummaryPdfProps = {
  patientName: string
  patientDni?: string
  professionalName: string
  professionalLicense: string
  periodFrom: string
  periodTo: string
  content: string
  approvedAt: string
}

export function ClosingSummaryDocument({
  patientName,
  patientDni,
  professionalName,
  professionalLicense,
  periodFrom,
  periodTo,
  content,
  approvedAt,
}: ClosingSummaryPdfProps) {
  return (
    <div className="p-8 max-w-3xl mx-auto bg-white text-slate-900 font-sans print:p-0">
      <header className="border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">PUENTE — Resumen de Cierre de Tratamiento</h1>
        <p className="text-xs text-slate-500 mt-1">
          Documento Clínico Oficial · Ley 26.529 de Derechos del Paciente
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 text-xs mb-6 border-b border-slate-200 pb-4">
        <div>
          <p><span className="font-semibold">Paciente:</span> {patientName}</p>
          {patientDni && <p><span className="font-semibold">DNI:</span> {patientDni}</p>}
          <p><span className="font-semibold">Período de atención:</span> {periodFrom} a {periodTo}</p>
        </div>
        <div>
          <p><span className="font-semibold">Profesional a cargo:</span> {professionalName}</p>
          <p><span className="font-semibold">Matrícula:</span> {professionalLicense}</p>
          <p><span className="font-semibold">Fecha de aprobación:</span> {approvedAt}</p>
        </div>
      </section>

      <main className="text-sm leading-relaxed whitespace-pre-wrap mb-12">
        {content}
      </main>

      <footer className="border-t border-slate-300 pt-6 mt-12 flex justify-between items-end text-xs text-slate-500">
        <div>
          <p>Validez legal garantizada por sellado digital y registro inmutable.</p>
          <p>Plataforma Puente Salud Mental</p>
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
