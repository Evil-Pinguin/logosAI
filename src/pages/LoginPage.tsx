import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mail, Lock, Github } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGithub, loading, demoMode } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    let error
    if (mode === 'signin') {
      error = await signIn(email, password)
    } else {
      error = await signUp(email, password, fullName)
    }
    if (error) setAuthError(error.message || 'Ошибка авторизации')
    else navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 px-4 overflow-hidden">
      {/* Декоративные мягкие свечения на фоне (Apple liquid glass vibe) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/40 blur-[120px] mix-blend-overlay" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-200/30 blur-[120px] mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mx-auto mb-10 flex items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LogosAI</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
              Логопедическая платформа
            </p>
          </div>
        </div>

        {/* Жидкое стекло — карточка входа */}
        <Card className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl relative overflow-hidden">
          {/* Верхний акцентный градиент */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 opacity-60" />

          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl font-semibold text-slate-900">
              {mode === 'signin' ? 'Войти в аккаунт' : 'Создать аккаунт'}
            </CardTitle>
            <p className="text-center text-sm text-slate-500 mt-1">
              {mode === 'signin'
                ? 'Добро пожаловать обратно'
                : 'Присоединяйтесь к платформе'}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {demoMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-4 text-amber-700 text-sm backdrop-blur-md"
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold">Демо-режим:</span> введите{' '}
                  <span className="font-mono font-bold text-amber-800">test</span> /
                  <span className="font-mono font-bold text-amber-800">test</span>
                </span>
              </motion.div>
            )}

            {authError && (
              <AnimatePresence mode="wait">
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-rose-50/80 border border-rose-200/60 p-4 text-rose-700 text-sm backdrop-blur-md"
                >
                  <span className="font-semibold">{authError}</span>
                </motion.div>
              </AnimatePresence>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Имя и фамилия
                  </label>
                  <div className="relative group">
                    <input
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white disabled:opacity-70 disabled:pointer-events-none"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Иван Иванов"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Электронная почта
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail />
                  </div>
                  <input
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white disabled:opacity-70 disabled:pointer-events-none"
                    type={demoMode ? "text" : "email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={demoMode ? "test" : "ivan@example.com"}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Пароль
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock />
                  </div>
                  <input
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:bg-white disabled:opacity-70 disabled:pointer-events-none"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
                      />
                      {mode === 'signin' ? 'Вход…' : 'Создание аккаунта…'}
                    </span>
                  </>
                ) : (
                  mode === 'signin' ? 'Войти' : 'Создать аккаунт'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/60 px-3 text-slate-400 backdrop-blur-sm">
                  Или продолжить с
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => signInWithGithub()}
                disabled={loading || demoMode}
                className="h-10 rounded-xl font-medium text-xs tracking-wide border border-slate-200 hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <Github className="h-4 w-4" /> GitHub
              </Button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-3">
              {mode === 'signin'
                ? 'Нет аккаунта? '
                : 'Уже есть аккаунт? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors underline-offset-4 hover:underline"
              >
                {mode === 'signin' ? 'Создать аккаунт' : 'Войти'}
              </button>
            </p>
          </CardContent>
        </Card>

        <Link
          to="/dashboard"
          className="mt-10 block text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Вернуться к дашборду (если уже вошли)
        </Link>
      </motion.div>
    </div>
  )
}
