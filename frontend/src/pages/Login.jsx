import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, fullName)
      }
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Something went wrong. Check your details and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-mono font-semibold">
            CB
          </div>
          <div className="text-lg font-semibold">Chargeback Assistant</div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 shadow-panel">
          <div className="flex gap-1 mb-6 bg-raised rounded-md p-1">
            <button
              className={`flex-1 py-1.5 rounded text-sm transition-colors ${
                mode === 'login' ? 'bg-accent/15 text-accent' : 'text-muted'
              }`}
              onClick={() => setMode('login')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`flex-1 py-1.5 rounded text-sm transition-colors ${
                mode === 'register' ? 'bg-accent/15 text-accent' : 'text-muted'
              }`}
              onClick={() => setMode('register')}
              type="button"
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-muted mb-1.5">Full name</label>
                <input
                  className="w-full bg-base border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Reyes"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-muted mb-1.5">Email</label>
              <input
                type="email"
                required
                className="w-full bg-base border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@company.com"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full bg-base border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-high bg-high/10 border border-high/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-base font-medium rounded-md py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
