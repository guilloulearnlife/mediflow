import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import MapWrapper from '@/components/MapWrapper'
import HorairesClinik from '@/components/HorairesClinik'

export default async function RecherchePage() {
  const supabase = await createClient()

  const { data: cliniques } = await supabase
    .from('cliniques')
    .select('*')
    .eq('actif', true)

  const { data: rdvMedecins } = await supabase
    .from('rendez_vous')
    .select('medecin')
    .neq('medecin', null)

  const uniqueMedecins = [...new Set(rdvMedecins?.map(r => r.medecin).filter(Boolean))]

  return (
    <main className="min-h-screen bg-[#060D1A]">

      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#060D1A]/90 backdrop-blur z-40">
        <Link href="/" className="text-2xl font-black text-white">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm hidden md:block">
            {cliniques?.length ?? 0} cliniques · {uniqueMedecins.length} médecins
          </span>
          <Link href="/auth/login"
            className="bg-white/5 border border-white/10 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
            Espace clinique →
          </Link>
        </div>
      </nav>

      <div className="px-8 py-14 text-center">
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse"></span>
          Disponible dans les 10 régions du Cameroun
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Trouvez votre <span className="text-[#00E5A0]">médecin</span>
        </h1>
        <p className="text-white/50 text-lg mb-10">
          Prenez rendez-vous en ligne · Rappels automatiques WhatsApp
        </p>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 flex gap-2 shadow-2xl">
          <input type="text" placeholder="Médecin, spécialité..."
            className="flex-1 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB]" />
          <input type="text" placeholder="Ville..."
            className="w-40 px-4 py-3 text-[#0C1E35] text-sm outline-none rounded-xl bg-[#F4F7FB]" />
          <button className="bg-[#00E5A0] text-[#060D1A] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#00B87D] transition-colors">
            Rechercher
          </button>
        </div>
      </div>

      <div className="px-8 pb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">

          {/* CARTE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden" style={{ height: '480px' }}>
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-white font-black text-sm">🗺️ Carte des cliniques</div>
                <div className="text-white/40 text-xs mt-0.5">Cameroun · 10 régions couvertes</div>
              </div>
              <span className="bg-[#00E5A0]/10 text-[#00E5A0] text-xs font-bold px-3 py-1 rounded-full border border-[#00E5A0]/20">
                🟢 Live
              </span>
            </div>
            <div style={{ height: 'calc(100% - 60px)' }}>
              <MapWrapper cliniques={cliniques ?? []} />
            </div>
          </div>

          {/* LISTE CLINIQUES */}
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-black text-xl">
              Cliniques <span className="text-[#00E5A0]">({cliniques?.length ?? 0})</span>
            </h2>
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '420px' }}>
              {cliniques && cliniques.length > 0 ? (
                cliniques.map((clinique) => (
                  <div key={clinique.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#00E5A0]/40 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#00E5A0]/20 flex items-center justify-center text-2xl flex-shrink-0">🏥</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-black">{clinique.nom}</div>
                        <div className="text-white/40 text-xs mt-1">📍 {clinique.adresse ?? clinique.ville}</div>
                        {clinique.telephone && (
                          <div className="text-white/40 text-xs mt-0.5">📞 {clinique.telephone}</div>
                        )}
                        {clinique.specialites && (clinique.specialites as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(clinique.specialites as string[]).map((s: string) => (
                              <span key={s} className="bg-[#00E5A0]/10 text-[#00E5A0] text-xs font-bold px-2 py-0.5 rounded-full border border-[#00E5A0]/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {clinique.horaires && (
                      <div className="border-t border-white/10 pt-4 mt-2">
                        <HorairesClinik horaires={clinique.horaires} />
                      </div>
                    )}

                    <button className="mt-4 w-full bg-[#00E5A0] text-[#060D1A] px-4 py-2.5 rounded-xl text-xs font-black hover:bg-[#00B87D] transition-colors">
                      Prendre RDV
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/40 py-12">Aucune clinique disponible</div>
              )}
            </div>
          </div>
        </div>

        {uniqueMedecins.length > 0 && (
          <>
            <h2 className="text-white font-black text-xl mb-4">
              Médecins disponibles <span className="text-[#00E5A0]">({uniqueMedecins.length})</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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