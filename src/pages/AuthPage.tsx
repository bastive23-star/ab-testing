import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { unlock, setName } from '../lib/auth'
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
    <div className="min-h-dvh flex flex-col px-6 py-14">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-auto"
      >
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#9B9894] mb-1">München</p>
        <h1 className="font-serif text-6xl text-[#111110] leading-[1]">
          A/B<br />Testing
        </h1>
        <p className="text-sm text-[#9B9894] mt-3 font-light">Essen. Bewerten. Ranking.</p>
      </motion.div>

      {/* Divider */}
      <div className="my-10 h-px bg-[#E8E6E0]" />

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-sm w-full"
      >
        <AnimatePresence mode="wait">
          {step === 'password' ? (
            <motion.form
              key="pw"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onSubmit={handlePassword}
              className="space-y-4"
            >
              <div className="mb-5">
                <h2 className="font-serif text-2xl text-[#111110]">Zugang</h2>
                <p className="text-sm text-[#9B9894] mt-1">Nur für geladene Gäste.</p>
              </div>
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-sm text-[#C8302A]"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button variant="primary" size="lg" type="submit" className="w-full">
                Weiter →
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="name"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              onSubmit={handleName}
              className="space-y-4"
            >
              <div className="mb-5">
                <h2 className="font-serif text-2xl text-[#111110]">Wer bist du?</h2>
                <p className="text-sm text-[#9B9894] mt-1">Erscheint bei deinen Bewertungen.</p>
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
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-sm text-[#C8302A]"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button variant="primary" size="lg" type="submit" className="w-full">
                Los geht's →
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <p className="text-xs text-[#C0BEB8] mt-12">© 2025 A/B Testing</p>
    </div>
  )
}
