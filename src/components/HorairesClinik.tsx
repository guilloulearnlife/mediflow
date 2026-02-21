'use client'

interface Horaire {
  ouverture: string | null
  fermeture: string | null
}

interface Horaires {
  lundi: Horaire
  mardi: Horaire
  mercredi: Horaire
  jeudi: Horaire
  vendredi: Horaire
  samedi: Horaire
  dimanche: Horaire
}

export default function HorairesClinik({ horaires }: { horaires: Horaires }) {
  const jours = [
    { key: 'lundi', label: 'Lun' },
    { key: 'mardi', label: 'Mar' },
    { key: 'mercredi', label: 'Mer' },
    { key: 'jeudi', label: 'Jeu' },
    { key: 'vendredi', label: 'Ven' },
    { key: 'samedi', label: 'Sam' },
    { key: 'dimanche', label: 'Dim' },
  ]

  const aujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()

  const jourActuel = horaires[aujourdhui as keyof Horaires]
  const estOuvert = jourActuel?.ouverture !== null

  return (
    <div>
      {/* Statut actuel */}
      <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl w-fit ${
        estOuvert ? 'bg-[#00E5A0]/10 border border-[#00E5A0]/20' : 'bg-red-500/10 border border-red-500/20'
      }`}>
        <div className={`w-2 h-2 rounded-full ${estOuvert ? 'bg-[#00E5A0] animate-pulse' : 'bg-red-400'}`}></div>
        <span className={`text-xs font-bold ${estOuvert ? 'text-[#00E5A0]' : 'text-red-400'}`}>
          {estOuvert
            ? `Ouvert · ${jourActuel.ouverture} – ${jourActuel.fermeture}`
            : 'Fermé aujourd\'hui'
          }
        </span>
      </div>

      {/* Grille horaires */}
      <div className="flex flex-col gap-1">
        {jours.map(({ key, label }) => {
          const h = horaires[key as keyof Horaires]
          const isToday = key === aujourdhui
          return (
            <div key={key} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
              isToday ? 'bg-[#00E5A0]/10' : ''
            }`}>
              <span className={`text-xs font-bold ${isToday ? 'text-[#00E5A0]' : 'text-white/50'}`}>
                {label}
              </span>
              <span className={`text-xs ${isToday ? 'text-white font-bold' : 'text-white/40'}`}>
                {h.ouverture ? `${h.ouverture} – ${h.fermeture}` : 'Fermé'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}