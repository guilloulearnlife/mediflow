import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060D1A] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse"></span>
          Disponible dans tout le Cameroun
        </div>

        {/* Logo */}
        <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </h1>

        <p className="text-xl text-white/50 mb-12 leading-relaxed">
          La plateforme de santé numérique #1 au Cameroun.<br />
          Trouvez, consultez, guérissez.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/recherche"
            className="bg-[#00E5A0] text-[#060D1A] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#00B87D] transition-colors"
          >
            Trouver un médecin
          </Link>
          <Link
            href="/auth/login"
            className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
          >
            Espace clinique →
          </Link>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 mt-16">
          {[
            { val: '240+', label: 'Médecins' },
            { val: '85+', label: 'Cliniques' },
            { val: '10', label: 'Régions' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white">{s.val}</div>
              <div className="text-sm text-white/30 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}