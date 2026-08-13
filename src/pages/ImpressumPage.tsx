import { useNavigate } from 'react-router-dom'

export function ImpressumPage() {
  const nav = useNavigate()
  return (
    <div className="px-5 pt-14 pb-16 max-w-xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9B9894] mb-8">
        <ChevronLeft /> Zurück
      </button>

      <h1 className="font-serif text-4xl text-[#111110] mb-8">Impressum</h1>

      <Section title="Angaben gemäß § 5 TMG">
        <p>Sebastian Vitzthum</p>
        <p>Demleitnerstraße 11</p>
        <p>81371 München</p>
      </Section>

      <Section title="Kontakt">
        <p>E-Mail: <a href="mailto:sebastian.vitzthum@vizz.de" className="text-[#C8302A]">sebastian.vitzthum@vizz.de</a></p>
      </Section>

      <Section title="Hinweis zur Website">
        <p>
          Diese Website ist ein privates, nicht-kommerzielles Projekt zur gemeinsamen Bewertung von Restaurants.
          Es werden keine kommerziellen Zwecke verfolgt und keine Einnahmen erzielt.
        </p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p>
          Als Betreiber dieser privaten Website sind die Inhalte nach § 7 Abs. 1 TMG für eigene Inhalte
          verantwortlich. Eine Verpflichtung zur Überwachung übermittelter oder gespeicherter fremder
          Informationen besteht gemäß §§ 8–10 TMG nicht.
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t border-[#F0EEE8]">
        <a href="#/datenschutz" className="text-sm text-[#C8302A]">→ Datenschutzerklärung</a>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-[#111110] text-sm uppercase tracking-wider mb-2">{title}</h2>
      <div className="text-sm text-[#6B6560] space-y-1 leading-relaxed">{children}</div>
    </div>
  )
}

function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
