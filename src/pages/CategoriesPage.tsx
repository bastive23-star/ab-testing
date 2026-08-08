import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../lib/queries'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const EMOJIS = ['🥖','🥩','🫙','🌿','🏮','💰','🌶️','🧅','🫚','🍋','⭐','🔥','❄️','🫀','🎯']

export function CategoriesPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWeight, setNewWeight] = useState(10)
  const [newEmoji, setNewEmoji] = useState('⭐')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editWeight, setEditWeight] = useState(10)

  const { data: cats = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const totalWeight = cats.reduce((s, c) => s + c.weight, 0)

  const createMut = useMutation({
    mutationFn: () => createCategory({ name: newName.trim(), weight: newWeight, emoji: newEmoji, created_by: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setAdding(false); setNewName(''); setNewWeight(10)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id }: { id: string }) => updateCategory(id, { name: editName.trim(), weight: editWeight }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setEditing(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  if (!user) {
    return (
      <div className="px-4 pt-24 text-center">
        <p className="text-[#6B6560]">Bitte einloggen.</p>
        <Button variant="primary" className="mt-4 mx-auto" onClick={() => nav('/auth')}>Einloggen</Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-4 max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#C8302A] mb-1">Einstellungen</p>
        <h1 className="font-serif text-3xl text-[#1A1714]">Kategorien</h1>
        <p className="text-sm text-[#6B6560] mt-1">Gesamtgewicht: {totalWeight} · Bewertungen nutzen automatisch alle Kategorien</p>
      </motion.div>

      <div className="space-y-2">
        <AnimatePresence>
          {cats.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {editing === cat.id ? (
                <GlassCard className="p-4 space-y-3">
                  <Input label="Name" value={editName} onChange={e => setEditName(e.target.value)} />
                  <div className="flex items-center gap-3">
                    <label className="flex flex-col gap-1.5 flex-1">
                      <span className="text-sm font-medium text-[#1A1714]">Gewicht (1–30)</span>
                      <input
                        type="number" min={1} max={30} value={editWeight}
                        onChange={e => setEditWeight(Number(e.target.value))}
                        className="glass rounded-[14px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C8302A]/30"
                      />
                    </label>
                    <div className="flex flex-col gap-1 pt-6">
                      <Button variant="primary" size="sm" loading={updateMut.isPending} onClick={() => updateMut.mutate({ id: cat.id })}>
                        Speichern
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Abbrechen</Button>
                    </div>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="p-3.5 flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#1A1714]">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-black/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C8302A]/60 rounded-full"
                          style={{ width: `${(cat.weight / Math.max(totalWeight, 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#9E9791] shrink-0">{cat.weight}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setEditing(cat.id); setEditName(cat.name); setEditWeight(cat.weight) }}
                      className="p-2 glass-subtle rounded-xl text-[#6B6560] hover:text-[#1A1714] transition-colors"
                      aria-label="Bearbeiten"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => deleteMut.mutate(cat.id)}
                      className="p-2 glass-subtle rounded-xl text-red-400 hover:text-red-600 transition-colors"
                      aria-label="Löschen"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add new */}
        <AnimatePresence>
          {adding ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <GlassCard variant="strong" className="p-4 space-y-3">
                <p className="text-sm font-semibold text-[#1A1714]">Neue Kategorie</p>
                <Input label="Name" placeholder="z.B. Tempura" value={newName} onChange={e => setNewName(e.target.value)} />
                <div>
                  <p className="text-sm font-medium text-[#1A1714] mb-2">Emoji</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setNewEmoji(e)}
                        className={`text-xl p-2 rounded-xl transition-all ${newEmoji === e ? 'glass-strong ring-2 ring-[#C8302A]/40' : 'glass-subtle'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#1A1714]">Gewicht (1–30)</span>
                  <input
                    type="number" min={1} max={30} value={newWeight}
                    onChange={e => setNewWeight(Number(e.target.value))}
                    className="glass rounded-[14px] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C8302A]/30"
                  />
                </label>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" loading={createMut.isPending} disabled={!newName.trim()} onClick={() => createMut.mutate()} className="flex-1">
                    Hinzufügen
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setAdding(false)} className="flex-1">
                    Abbrechen
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button variant="glass" size="lg" className="w-full" onClick={() => setAdding(true)}>
                <span className="text-lg mr-1">+</span> Kategorie hinzufügen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}
