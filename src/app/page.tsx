import Link from 'next/link'
import HeroDashboard from '@/components/HeroDashboard'
import { CheckCircle2, MapPin, Shield } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060D1A] flex flex-col overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <span className="text-xl font-black text-white tracking-tight">
          Medi<span className="text-[#00E5A0]">Flow</span>
        </span>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <Link href="/recherche" className="hover:text-white transition-colors">Trouver un médecin</Link>
          <Link href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</Link>
          <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
        </nav>
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-[#060D1A] bg-[#00E5A0] px-4 py-2 rounded-lg hover:bg-[#00c98c] transition-colors"
        >
          Espace clinique
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">

        {/* Left — Copy */}
        <div className="flex flex-col gap-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 w-fit bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5A0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5A0]" />
            </span>
            Phase de lancement · Accès prioritaire ouvert
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
              La gestion de<br />
              <span className="text-[#00E5A0]">clinique</span> en<br />
              temps réel
            </h1>
            <p className="mt-5 text-lg text-white/55 leading-relaxed max-w-md">
              Agenda intelligent, rappels WhatsApp automatiques, fiches patients —
              tout ce dont votre clinique a besoin, sans la complexité.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-[#00E5A0] text-[#060D1A] px-7 py-3.5 rounded-xl font-bold text-sm hover:shadow-[0_0_24px_rgba(0,229,160,0.35)] transition-all"
            >
              Démarrer gratuitement
            </Link>
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
            >
              Trouver un médecin →
            </Link>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { Icon: Shield,       label: 'Données sécurisées' },
              { Icon: MapPin,       label: 'Douala · Yaoundé' },
              { Icon: CheckCircle2, label: 'WhatsApp intégré' },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-white/40 bg-white/[0.04] border border-white/8 px-3 py-1.5 rounded-full">
                <Icon className="w-3 h-3 text-[#00E5A0]" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Animated illustration */}
        <div className="flex items-center justify-center md:justify-end">
          <HeroDashboard />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="fonctionnalites" className="border-t border-white/5 py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-[#00E5A0] text-center mb-3">Fonctionnalités</p>
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-14 tracking-tight">
            Tout ce qu&apos;il faut pour bien gérer
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: '📅',
                title: 'Agenda intelligent',
                desc: "Vue journalière ou hebdomadaire, statut en un clic, mise à jour en temps réel pour toute l'équipe.",
              },
              {
                emoji: '💬',
                title: 'Rappels WhatsApp auto',
                desc: 'Envoi automatique J‑3, J‑1 et le jour J — zéro absentéisme, zéro effort manuel.',
              },
              {
                emoji: '🩺',
                title: 'Fiches patients complètes',
                desc: 'Historique des consultations, notes du médecin, coordonnées et statistiques par patient.',
              },
              {
                emoji: '👨‍⚕️',
                title: 'Espace médecin dédié',
                desc: 'Chaque médecin voit uniquement son agenda et ses patients, avec accès aux notes de consultation.',
              },
              {
                emoji: '🏥',
                title: 'Multi-praticiens',
                desc: 'Gérez plusieurs médecins et spécialités depuis un seul tableau de bord directeur.',
              },
              {
                emoji: '🔍',
                title: 'Annuaire public',
                desc: "Les patients trouvent votre clinique, voient les créneaux disponibles et réservent directement en ligne.",
              },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-[#0D1B2E] border border-white/8 rounded-2xl p-6 hover:border-[#00E5A0]/30 transition-colors">
                <div className="text-3xl mb-4">{emoji}</div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="border-t border-white/5 py-14 px-6 md:px-12 bg-[#0A1628]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          {[
            { value: '< 2 min', label: 'Pour créer un RDV' },
            { value: '94%',    label: 'Taux de présence moyen' },
            { value: 'J-3 J-1', label: 'Rappels automatiques' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-black text-[#00E5A0] font-mono">{value}</p>
              <p className="text-sm text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA finale ── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-black text-white tracking-tight mb-5">
            Prêt à moderniser<br />votre clinique&nbsp;?
          </h2>
          <p className="text-white/50 mb-8">
            Démarrez gratuitement, sans carte bancaire. Configuration en moins de 10 minutes.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#060D1A] px-10 py-4 rounded-xl font-black text-base hover:shadow-[0_0_30px_rgba(0,229,160,0.4)] transition-all"
          >
            Créer mon espace clinique
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="border-t border-white/5 py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-white/20 text-xs">© 2026 MediFlow — Tous droits réservés</span>
        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link href="/recherche" className="hover:text-white/60 transition-colors">Annuaire</Link>
          <Link href="/auth/login" className="hover:text-white/60 transition-colors">Connexion</Link>
          <a href="mailto:contact@mediflow.cm" className="hover:text-white/60 transition-colors">contact@mediflow.cm</a>
        </div>
      </footer>

    </main>
  )
}
