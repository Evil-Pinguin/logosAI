import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mail, Lock, Github } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mx-auto mb-8 flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">LogosAI</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {mode === 'signin' ? 'Вход в аккаунт' : 'Создать аккаунт'}
            </CardTitle>
            <p className="text-center text-sm text-slate-500">
              Платформа для логопедов и дефектологов
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Имя и фамилия
                  </label>
                  <input
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Иван Иванов"
                    disabled={loading}
                    required
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Электронная почта
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ivan@example.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </form>

            {authError && (
              <div className="rounded-lg bg-rose-50 p-3 text-rose-700 text-sm border border-rose-100 text-center">
                {authError}
              </div>
            )}
            {demoMode && (
              <div className="rounded-lg bg-amber-50 p-3 text-amber-700 text-sm border border-amber-100 text-center">
                <span className="font-medium">Демо-режим:</span> введите{' '}
                <span className="font-mono font-bold">test</span> /{' '}
                <span className="font-mono font-bold">test</span> для входа без Supabase.
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Или продолжить с</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => signInWithGithub()}
                disabled={loading}
                className="flex items-center justify-center gap-2"
              >
                <Github className="h-4 w-4" /> GitHub
              </Button>
            </div>

            <p className="text-center text-sm text-slate-600">
              {mode === 'signin'
                ? 'Нет аккаунта? '
                : 'Уже есть аккаунт? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-indigo-600 font-medium hover:underline"
              >
                {mode === 'signin' ? 'Создать аккаунт' : 'Войти'}
              </button>
            </p>
          </CardContent>
        </Card>

        <Link
          to="/dashboard"
          className="mt-8 block text-center text-sm text-slate-500 hover:text-indigo-600 hover:underline"
        >
          ← Вернуться к дашборду (если уже вошли)
        </Link>
      </motion.div>
    </div>
  )
}
