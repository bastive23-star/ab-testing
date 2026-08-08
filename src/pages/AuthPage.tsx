import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { upsertProfile } from '../lib/queries'
import { isAllowed } from '../lib/allowlist'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type Mode = 'login' | 'signup'

export function AuthPage() {
  const nav = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const emailTrimmed = email.trim().toLowerCase()
    if (!isAllowed(emailTrimmed)) {
      setError('Diese E-Mail ist nicht für den Zugriff berechtigt.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!username.trim()) { setError('Benutzername fehlt'); setLoading(false); return }
        const { user } = await createUserWithEmailAndPassword(auth, emailTrimmed, password)
        await updateProfile(user, { displayName: username.trim() })
        await upsertProfile(user.uid, username.trim())
        nav('/')
      } else {
        await signInWithEmailAndPassword(auth, emailTrimmed, password)
        nav('/')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('E-Mail oder Passwort falsch.')
      } else if (msg.includes('email-already-in-use')) {
        setError('Diese E-Mail ist bereits registriert.')
      } else if (msg.includes('weak-password')) {
        setError('Passwort muss mindestens 6 Zeichen haben.')
      } else {
        setError('Fehler beim Anmelden.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#C8302A]/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#E85D04]/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🥖</div>
          <h1 className="font-serif text-3xl text-[#1A1714]">Bánh Mì<br />München</h1>
          <p className="text-sm text-[#9E9791] mt-2">Nur für geladene Gäste</p>
        </div>

        <GlassCard variant="strong" className="p-6">
          <div className="flex glass-subtle rounded-[14px] p-1 mb-6">
            {(['login', 'signup'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${mode === m ? 'bg-white shadow-sm text-[#1A1714]' : 'text-[#9E9791]'}`}>
                {m === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  <Input label="Benutzername" placeholder="Dein Name" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
                </motion.div>
              )}
            </AnimatePresence>
            <Input label="E-Mail" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            <Input label="Passwort" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-sm text-red-500 bg-red-50 rounded-xl py-2.5 px-3">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Einloggen' : 'Account erstellen'}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  )
}
