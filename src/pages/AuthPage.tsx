import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { unlock, setName } from '../lib/auth'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function AuthPage() {
  const nav = useNavigate()
  const [step, setStep] = useState<'password' | 'name'>('password')
  const [password, setPassword] = useState('')
  const [name, setNameVal] = useState('')
  const [error, setError] = useState('')

  function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (unlock(password)) { setStep('name') }
    else setError('Falsches Passwort.')
  }

  function handleName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Bitte gib deinen Namen ein.'); return }
    setName(name.trim())
    nav('/')
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
          <h1 className="font-serif text-3xl text-[#1A1714]">A/B Testing</h1>
          <p className="text-sm text-[#9E9791] mt-2">Essen. Bewerten. Ranking.</p>
        </div>

        <GlassCard variant="strong" className="p-6">
          <AnimatePresence mode="wait">
            {step === 'password' ? (
              <motion.form
                key="pw"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onSubmit={handlePassword}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-semibold text-[#1A1714] mb-1">Passwort</h2>
                  <p className="text-xs text-[#9E9791]">Nur für geladene Gäste.</p>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                  autoFocus
                />
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm text-red-500 bg-red-50 rounded-xl py-2.5 px-3">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Button variant="primary" size="lg" type="submit" className="w-full">
                  Weiter
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="name"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={handleName}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-semibold text-[#1A1714] mb-1">Wie heißt du?</h2>
                  <p className="text-xs text-[#9E9791]">Wird bei deinen Bewertungen angezeigt.</p>
                </div>
                <Input
                  placeholder="Dein Name"
                  value={name}
                  onChange={e => { setNameVal(e.target.value); setError('') }}
                  autoComplete="name"
                  autoFocus
                />
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm text-red-500 bg-red-50 rounded-xl py-2.5 px-3">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Button variant="primary" size="lg" type="submit" className="w-full">
                  Los geht's 🥖
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  )
}
