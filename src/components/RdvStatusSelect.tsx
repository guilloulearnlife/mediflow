'use client'

import { useTransition } from 'react'
import { updateStatut, type Statut } from '@/app/actions/rdv'

const OPTIONS: { value: Statut; label: string }[] = [
  { value: 'confirme', label: 'Confirmé' },
  { value: 'termine',  label: 'Terminé'  },
  { value: 'absent',   label: 'Absent'   },
  { value: 'annule',   label: 'Annulé'   },
]

const selectStyles: Record<Statut, string> = {
  confirme: 'bg-blue-50 text-blue-700 border-blue-200',
  termine:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent:   'bg-red-50 text-red-600 border-red-200',
  annule:   'bg-slate-100 text-slate-500 border-slate-200',
}

export default function RdvStatusSelect({ rdvId, statut }: { rdvId: string; statut: Statut }) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={statut}
      disabled={pending}
      onChange={(e) => {
        const val = e.target.value as Statut
        startTransition(() => updateStatut(rdvId, val))
      }}
      className={`text-xs font-medium border rounded-md px-2 py-0.5 outline-none cursor-pointer transition-all duration-150 ${pending ? 'opacity-40 cursor-wait' : ''} ${selectStyles[statut] ?? selectStyles.confirme}`}
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
