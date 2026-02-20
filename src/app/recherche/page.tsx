import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function RecherchePage() {
  const supabase = await createClient()

  const { data: medecins } = await supabase
    .from('rendez_vous')
    .select('medecin')
    .neq('medecin', null)

  const uniqueMedecins = [...new Set(medecins?.map(r => r.medecin).filter(Boolean))]

  const { data: cliniques } = await supabase
    .from('cliniques')
    .select('*')
    .eq('actif', true)

  return (
    <main className="min-h-screen bg-[#060D1A]">

      {/* NAV */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-white">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </Link>
        <Link href="/auth/login"
          className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
          Espace clinique →
        </Link>
      </nav>

      {/* HERO */}
      <div className="px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse"></span>
          {cliniques?.length ?? 0} cliniques · {uniqueMedecins.length} médecins disponibles
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Trouvez votre <span className="text-[#00E5A0]">médecin</span>
        </h1>
        <p className="text-white/50 text-lg mb-10">Prenez rendez-vous en ligne dans toutes les régions du Cameroun</p>

        {/* SEARCH */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 flex gap-2 shadow-2xl">
          <input
            type="text"
            placeholder="Médecin, spécialité..."
            className="flex-1 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB]"
          />
          <input
            type="text"
            placeholder="Ville..."
            className="w-40 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB]"
          />
          <button className="bg-[#00E5A0] text-[#060D1A] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#00B87D] transition-colors">
            Rechercher
          </button>
        </div>
      </div>

      {/* CLINIQUES */}
      <div className="px-8 pb-16 max-w-6xl mx-auto">
        <h2 className="text-white font-black text-2xl mb-6">
          Cliniques disponibles <span className="text-[#00E5A0]">({cliniques?.length ?? 0})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cliniques && cliniques.length > 0 ? (
            cliniques.map((clinique) => (
              <div key={clinique.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#00E5A0]/40 hover:bg-white/8 transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00E5A0]/20 flex items-center justify-center text-2xl">
                    🏥
                  </div>
                  <div>
                    <div className="text-white font-black">{clinique.nom}</div>
                    <div className="text-white/40 text-xs mt-0.5">📍 {clinique.ville}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse"></div>
                    <span className="text-[#00E5A0] text-xs font-bold">Disponible</span>
                  </div>
                  <button className="bg-[#00E5A0] text-[#060D1A] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#00B87D] transition-colors">
                    Prendre RDV
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-white/40 py-12">
              Aucune clinique disponible pour le moment
            </div>
          )}
        </div>

        {/* MEDECINS */}
        {uniqueMedecins.length > 0 && (
          <>
            <h2 className="text-white font-black text-2xl mb-6 mt-12">
              Médecins <span className="text-[#00E5A0]">({uniqueMedecins.length})</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uniqueMedecins.map((medecin) => (
                <div key={medecin}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#00E5A0]/40 transition-all cursor-pointer text-center">
                  <div className="w-14 h-14 rounded-xl bg-[#00E5A0]/20 flex items-center justify-center text-2xl font-black text-[#00E5A0] mx-auto mb-3">
                    {medecin?.[4] ?? '?'}
                  </div>
                  <div className="text-white font-bold text-sm">{medecin}</div>
                  <div className="text-white/40 text-xs mt-1">Disponible</div>
                  <button className="mt-3 w-full bg-[#00E5A0]/10 border border-[#00E5A0]/20 text-[#00E5A0] text-xs font-bold py-2 rounded-xl hover:bg-[#00E5A0] hover:text-[#060D1A] transition-colors">
                    Réserver
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}