import React, { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cb_token'))
  const [ready, setReady] = useState(true)

  useEffect(() => {
    if (token) {
      localStorage.setItem('cb_token', token)
    } else {
      localStorage.removeItem('cb_token')
    }
  }, [token])

  async function login(email, password) {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const res = await client.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    setToken(res.data.access_token)
  }

  async function register(email, password, fullName) {
    await client.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    await login(email, password)
  }

  function logout() {
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
