'use client'

import { useState } from 'react'
import { signIn, signUp } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!fullName || !password) return alert('Заполни все поля')

    const { error } = isRegister
      ? await signUp(fullName, password)
      : await signIn(fullName, password)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="bg-white p-6 rounded-xl w-[320px] space-y-4 text-black">
        <h1 className="text-lg font-semibold text-center">
          {isRegister ? 'Регистрация' : 'Вход'}
        </h1>

        <input
          placeholder="Имя Фамилия"
          className="w-full border p-2 rounded"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          type="password"
          placeholder="Пароль"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white p-2 rounded"
        >
          {isRegister ? 'Создать аккаунт' : 'Войти'}
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-gray-500 w-full"
        >
          {isRegister
            ? 'Уже есть аккаунт? Войти'
            : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  )
}