import Link from 'next/link'
// Imagine que tu as des icônes simples (Lucide-react ou autre)
// import { ShieldCheck, Clock, MapPin } from 'lucide-react' 

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060D1A] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-3xl">
        
        {/* Badge - Plus "Actionnable" */}
        <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5A0] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5A0]"></span>
          </span>
          Phase de lancement : Accès prioritaire ouvert
        </div>

        {/* Logo */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </h1>

        {/* Message : On remplace "N°1" par une promesse de valeur précise */}
        <p className="text-xl text-white/70 mb-12 leading-relaxed max-w-xl mx-auto">
          Simplifiez votre parcours de santé au Cameroun. 
          <span className="text-white block font-semibold">Trouvez un spécialiste, gérez vos rendez-vous, accédez à vos soins.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/recherche"
            className="bg-[#00E5A0] text-[#060D1A] px-10 py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(0,229,160,0.4)] transition-all"
          >
            Trouver un médecin
          </Link>
          <Link
            href="/auth/login"
            className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
          >
            Espace clinique →
          </Link>
        </div>

        {/* Points de confiance (Remplace les faux chiffres) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 border-t border-white/5 pt-12">
          <div className="text-center">
            <div className="text-[#00E5A0] font-bold mb-1 uppercase tracking-widest text-xs">Sécurité</div>
            <div className="text-white font-medium italic">Données cryptées & confidentielles</div>
          </div>
          <div className="text-center">
            <div className="text-[#00E5A0] font-bold mb-1 uppercase tracking-widest text-xs">Proximité</div>
            <div className="text-white font-medium">Référencement local (Douala, Yaoundé...)</div>
          </div>
          <div className="text-center">
            <div className="text-[#00E5A0] font-bold mb-1 uppercase tracking-widest text-xs">Simplicité</div>
            <div className="text-white font-medium">Sans file d'attente interminable</div>
          </div>
        </div>

      </div>
    </main>
  )
}
