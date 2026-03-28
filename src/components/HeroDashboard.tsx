'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Phone } from 'lucide-react'

const APPOINTMENTS = [
  { name: 'Mme Nkomo Marie',   heure: '08:30', medecin: 'Dr. Kamga',   statut: 'termine',  motif: 'Cardiologie'   },
  { name: 'M. Fouda Jean',     heure: '09:00', medecin: 'Dr. Tchinda', statut: 'confirme', motif: 'Pédiatrie'     },
  { name: 'Mme Biya Pascale',  heure: '10:30', medecin: 'Dr. Kamga',   statut: 'confirme', motif: 'Gynécologie'   },
  { name: 'M. Manga Pierre',   heure: '11:00', medecin: 'Dr. Mbarga',  statut: 'confirme', motif: 'Consultation'  },
]

const statusDot: Record<string, string> = {
  confirme: 'bg-blue-400',
  termine:  'bg-emerald-400',
  absent:   'bg-red-400',
}
const statusLabel: Record<string, string> = {
  confirme: 'Confirmé',
  termine:  'Terminé',
  absent:   'Absent',
}

export default function HeroDashboard() {
  const [activeIdx, setActiveIdx] = useState(1)
  const [showWhatsapp, setShowWhatsapp] = useState(false)
  const [whatsappIdx, setWhatsappIdx] = useState(0)

  const WHATSAPP_MSGS = [
    { patient: 'M. Fouda Jean',    msg: 'Rappel RDV demain 09h00 · Dr. Tchinda' },
    { patient: 'Mme Biya Pascale', msg: 'RDV confirmé · 10h30 · Dr. Kamga'      },
  ]

  // Cycle through active appointment
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx(i => (i + 1) % APPOINTMENTS.length)
    }, 2800)
    return () => clearInterval(t)
  }, [])

  // Show WhatsApp bubble periodically
  useEffect(() => {
    const show = setInterval(() => {
      setWhatsappIdx(i => (i + 1) % WHATSAPP_MSGS.length)
      setShowWhatsapp(true)
      setTimeout(() => setShowWhatsapp(false), 3500)
    }, 5000)
    setTimeout(() => setShowWhatsapp(true), 1200)
    return () => clearInterval(show)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height: '480px' }}>

      {/* Glow background */}
      <div className="absolute inset-0 rounded-3xl bg-[#00E5A0]/5 blur-3xl scale-110 pointer-events-none" />

      {/* Main dashboard card */}
      <div
        className="absolute inset-0 bg-[#0D1B2E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'float 4s ease-in-out infinite' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-[#0A1628]">
          <div>
            <p className="text-white text-xs font-bold tracking-tight">Agenda du jour</p>
            <p className="text-white/30 text-[10px] mt-0.5">Clinique Centrale · Yaoundé</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-ping absolute" style={{ animationDuration: '2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" />
            <span className="text-[10px] text-[#00E5A0] font-bold ml-1">LIVE</span>
          </div>
        </div>

        {/* Appointment list */}
        <div className="divide-y divide-white/5">
          {APPOINTMENTS.map((rdv, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-5 py-3 transition-all duration-500 ${
                i === activeIdx ? 'bg-[#00E5A0]/8' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all duration-300 ${
                i === activeIdx ? 'bg-[#00E5A0] text-[#060D1A]' : 'bg-white/10 text-white/50'
              }`}>
                {rdv.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate transition-colors duration-300 ${i === activeIdx ? 'text-white' : 'text-white/50'}`}>
                  {rdv.name}
                </p>
                <p className="text-[10px] text-white/25 truncate">{rdv.medecin} · {rdv.motif}</p>
              </div>

              {/* Time + status */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] font-mono text-white/40">{rdv.heure}</span>
                <span className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  rdv.statut === 'termine'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-blue-500/15 text-blue-400'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${statusDot[rdv.statut]} ${i === activeIdx ? 'animate-pulse' : ''}`} />
                  {statusLabel[rdv.statut]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats bar */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-[#0A1628] border-t border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>1 terminé</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>3 à venir</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Phone className="w-3 h-3 text-[#00E5A0]" />
            <span>4 patients</span>
          </div>
        </div>
      </div>

      {/* WhatsApp notification bubble */}
      <div
        className={`absolute -bottom-4 -left-6 bg-[#075E54] border border-white/10 rounded-2xl px-4 py-3 shadow-xl max-w-[220px] transition-all duration-500 ${
          showWhatsapp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ animation: showWhatsapp ? 'slideInUp 0.4s ease-out' : undefined }}
      >
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">W</div>
          <div>
            <p className="text-[10px] font-bold text-white">MediFlow</p>
            <p className="text-[10px] text-white/60 mt-0.5 leading-snug">
              {WHATSAPP_MSGS[whatsappIdx].msg}
            </p>
            <p className="text-[9px] text-white/30 mt-1">à l&apos;instant · WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Floating stat badge */}
      <div
        className="absolute -top-4 -right-4 bg-[#0D1B2E] border border-[#00E5A0]/30 rounded-xl px-3 py-2 shadow-lg"
        style={{ animation: 'float 3s ease-in-out infinite 1s' }}
      >
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Aujourd&apos;hui</p>
        <p className="text-lg font-black text-[#00E5A0] font-mono">4 RDV</p>
      </div>

      {/* Presence rate badge */}
      <div
        className="absolute top-1/2 -right-8 bg-[#0D1B2E] border border-white/10 rounded-xl px-3 py-2 shadow-lg"
        style={{ animation: 'float 3.5s ease-in-out infinite 0.5s' }}
      >
        <p className="text-[10px] text-white/40">Taux présence</p>
        <p className="text-sm font-black text-white">94%</p>
        <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-[#00E5A0] rounded-full" style={{ width: '94%' }} />
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
