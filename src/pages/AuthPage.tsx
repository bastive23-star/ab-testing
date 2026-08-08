import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { upsertProfile } from '../lib/queries'
import { isAllowed } from '../lib/allowlist'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const REDIRECT_URL = 'https://bastive23-star.github.io/ab-testing/'

export function AuthPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(false)

  // Handle magic link redirect
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return
    setCompleting(true)
    const savedEmail = localStorage.getItem('emailForSignIn') ?? ''
    if (!savedEmail) {
      setError('E-Mail nicht gefunden. Bitte erneut anfordern.')
      setCompleting(false)
      return
    }
    signInWithEmailLink(auth, savedEmail, window.location.href)
      .then(async result => {
        localStorage.removeItem('emailForSignIn')
        const username = savedEmail.split('@')[0]
        await upsertProfile(result.user.uid, username)
        nav('/')
      })
      .catch(err => {
        setError(err.message)
        setCompleting(false)
      })
  }, [nav])

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
      await sendSignInLinkToEmail(auth, emailTrimmed, {
        url: REDIRECT_URL,
        handleCodeInApp: true,
      })
      localStorage.setItem('emailForSignIn', emailTrimmed)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden')
    } finally {
      setLoading(false)
    }
  }

  if (completing) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🥖</div>
          <p className="text-sm text-[#6B6560]">Einloggen…</p>
        </div>
      </div>
    )
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
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-3"
              >
                <div className="text-4xl">📬</div>
                <h2 className="font-semibold text-[#1A1714]">Link gesendet!</h2>
                <p className="text-sm text-[#6B6560]">
                  Check deine E-Mails — klick auf den Link um einzuloggen.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-xs text-[#9E9791] underline underline-offset-2"
                >
                  Andere E-Mail verwenden
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <h2 className="font-semibold text-[#1A1714] mb-1">Einloggen</h2>
                  <p className="text-xs text-[#9E9791]">Du bekommst einen Magic Link per E-Mail.</p>
                </div>
                <Input
                  label="E-Mail"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm text-red-500 bg-red-50 rounded-xl py-2.5 px-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full">
                  Magic Link senden
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  )
}
