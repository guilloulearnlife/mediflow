'use client'

import { useState, useTransition } from 'react'
import { saveNotes } from '@/app/actions/notes'
import { FileText, Save, Check, Loader2 } from 'lucide-react'

interface Props {
  rdvId: string
  initialNotes: string | null
  patientNom?: string
}

export default function NotesRdv({ rdvId, initialNotes, patientNom }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await saveNotes(rdvId, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Notes de consultation</h3>
      </div>
      {patientNom && (
        <p className="text-xs text-slate-400 mb-3">Pour {patientNom}</p>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all"
        placeholder="Symptômes, diagnostic, traitement, observations..."
      />
      <button
        onClick={handleSave}
        disabled={pending || saved}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-60
          bg-slate-900 hover:bg-slate-800 text-white"
      >
        {pending
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sauvegarde...</>
          : saved
          ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Sauvegardé</>
          : <><Save className="w-3.5 h-3.5" />Sauvegarder</>
        }
      </button>
    </div>
  )
}
