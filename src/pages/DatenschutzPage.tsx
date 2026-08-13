import { useNavigate } from 'react-router-dom'

export function DatenschutzPage() {
  const nav = useNavigate()
  return (
    <div className="px-5 pt-14 pb-16 max-w-xl mx-auto">
      <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-[#9B9894] mb-8">
        <ChevronLeft /> Zurück
      </button>

      <h1 className="font-serif text-4xl text-[#111110] mb-2">Datenschutz&shy;erklärung</h1>
      <p className="text-xs text-[#9B9894] mb-8">Gemäß DSGVO &amp; BDSG</p>

      <Section title="1. Verantwortlicher">
        <p>Sebastian Vitzthum · Demleitnerstraße 11 · 81371 München</p>
        <p>E-Mail: <a href="mailto:sebastian.vitzthum@vizz.de" className="text-[#C8302A]">sebastian.vitzthum@vizz.de</a></p>
      </Section>

      <Section title="2. Allgemeines">
        <p>
          Diese Website ist ein privates, nicht-kommerzielles Projekt. Es werden keine Daten zu Werbezwecken
          verarbeitet und keine Nutzerprofile erstellt. Die Nutzung erfolgt freiwillig im Rahmen eines
          geschlossenen Freundeskreises.
        </p>
      </Section>

      <Section title="3. Gespeicherte Daten">
        <p><strong className="text-[#111110]">In der Datenbank (Firebase Firestore):</strong></p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>Selbst gewählte Anzeigenamen (kein Klarname erforderlich)</li>
          <li>Bewertungen und Punktzahlen zu Restaurants</li>
          <li>Restaurant-Informationen (Name, Adresse, Kategorie)</li>
        </ul>
        <p className="mt-3"><strong className="text-[#111110]">Lokal im Browser (localStorage):</strong></p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>Authentifizierungsstatus (Passwort-Hash)</li>
          <li>Gewählter Anzeigename</li>
          <li>Theme-Einstellung (Hell/Dunkel)</li>
        </ul>
        <p className="mt-3">Es werden keine Cookies gesetzt. Es findet kein Tracking statt.</p>
      </Section>

      <Section title="4. Hosting & Dienstleister">
        <p><strong className="text-[#111110]">Firebase (Google):</strong> Die Datenbank wird über Google Firebase (Firestore) betrieben.
          Betreiber: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
          Datenschutzerklärung: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C8302A]">firebase.google.com/support/privacy</a></p>
        <p className="mt-2"><strong className="text-[#111110]">GitHub Pages:</strong> Das Hosting erfolgt über GitHub Pages.
          Betreiber: GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA.
          Datenschutzerklärung: <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-[#C8302A]">docs.github.com → Privacy Statement</a></p>
      </Section>

      <Section title="5. Rechtsgrundlage">
        <p>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
          sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch freiwillige Nutzung der Plattform).
        </p>
      </Section>

      <Section title="6. Deine Rechte">
        <p>Du hast jederzeit das Recht auf:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung falscher Daten (Art. 16 DSGVO)</li>
          <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
        </ul>
        <p className="mt-2">Anfragen an: <a href="mailto:sebastian.vitzthum@vizz.de" className="text-[#C8302A]">sebastian.vitzthum@vizz.de</a></p>
        <p className="mt-2">Du hast außerdem das Recht, dich bei der zuständigen Aufsichtsbehörde zu beschweren
          (Bayerisches Landesamt für Datenschutzaufsicht, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" className="text-[#C8302A]">lda.bayern.de</a>).</p>
      </Section>

      <Section title="7. Datenlöschung">
        <p>
          Daten werden gelöscht, sobald sie für den Zweck der Verarbeitung nicht mehr benötigt werden
          oder auf Anfrage. Daten im Browser-Speicher kannst du jederzeit selbst über die
          Browser-Einstellungen löschen.
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t border-[#F0EEE8]">
        <p className="text-xs text-[#9B9894]">Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
        <a href="#/impressum" className="text-sm text-[#C8302A] mt-2 block">→ Impressum</a>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-[#111110] text-sm mb-2">{title}</h2>
      <div className="text-sm text-[#6B6560] space-y-1 leading-relaxed">{children}</div>
    </div>
  )
}

function ChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
