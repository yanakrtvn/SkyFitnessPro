import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthService from '../AuthService'

const { 
  login, 
  register, 
  checkAuth, 
  logout, 
  validatePassword, 
  validateEmail,
  AUTH_ERRORS
} = AuthService

vi.mock('../../core/FitApi', () => ({
  default: {
    post: vi.fn()
  }
}))

import api from '../../core/FitApi'

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('validateEmail', () => {
    it('должен возвращать true для корректного email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('user-name@domain.com')).toBe(true)
      expect(validateEmail('user_name@domain.io')).toBe(true)
    })

    it('должен возвращать false для некорректного email', () => {
      expect(validateEmail('test')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@example')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('test@example.')).toBe(false)
      expect(validateEmail('test@.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('должен возвращать ошибку для пароля короче 6 символов', () => {
      expect(validatePassword('12345')).toBe('Пароль должен быть не менее 6 символов')
      expect(validatePassword('Abc1!')).toBe('Пароль должен быть не менее 6 символов')
    })

    it('должен возвращать ошибку если нет заглавной буквы', () => {
      expect(validatePassword('abcdef1!')).toBe('Добавьте хотя бы одну заглавную букву')
      expect(validatePassword('abcdefg!@#123')).toBe('Добавьте хотя бы одну заглавную букву')
    })

    it('должен возвращать ошибку если нет спецсимвола', () => {
      expect(validatePassword('Abcdef1')).toBe('Добавьте хотя бы один специальный символ')
      expect(validatePassword('Abcdef123')).toBe('Добавьте хотя бы один специальный символ')
    })

    it('должен возвращать null для корректного пароля', () => {
      expect(validatePassword('Abcdef1!')).toBe(null)
      expect(validatePassword('StrongP@ssw0rd')).toBe(null)
      expect(validatePassword('Test123!@#')).toBe(null)
    })
  })

  describe('login', () => {
    it('должен возвращать ошибку при невалидном email', async () => {
      const result = await login('invalid-email', 'password123')
      
      expect(result).toEqual({
        success: false,
        error: 'Некорректный email. Проверьте формат.',
        field: 'email'
      })
    })

    it('должен возвращать ошибку при пустом пароле', async () => {
      const result = await login('test@example.com', '')
      
      expect(result).toEqual({
        success: false,
        error: 'Введите пароль',
        field: 'password'
      })
    })

    it('должен успешно логиниться и сохранять токен', async () => {
      const mockToken = 'test-token-123'
      api.post.mockResolvedValue({
        success: true,
        data: { token: mockToken }
      })

      const result = await login('test@example.com', 'ValidPass1!')

      expect(api.post).toHaveBeenCalledWith('/auth/login', { 
        email: 'test@example.com', 
        password: 'ValidPass1!' 
      })
      
      expect(result.success).toBe(true)
      expect(result.token).toBe(mockToken)
      expect(result.email).toBe('test@example.com')
      expect(result.timestamp).toBeDefined()
      
      expect(localStorage.getItem('token')).toBe(mockToken)
      expect(localStorage.getItem('email')).toBe('test@example.com')
      expect(localStorage.getItem('auth_time')).toBeTruthy()
    })

    it('должен обрабатывать ошибку сервера с сообщением', async () => {
      api.post.mockResolvedValue({
        success: false,
        data: { message: 'Пользователь не найден' }
      })

      const result = await login('test@example.com', 'wrongpass')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Пользователь не найден')
    })

    it('должен обрабатывать ошибку сервера без сообщения', async () => {
      api.post.mockResolvedValue({
        success: false,
        data: {}
      })

      const result = await login('test@example.com', 'wrongpass')

      expect(result.success).toBe(false)
      expect(result.error).toBe(AUTH_ERRORS.loginIncorrect)
    })

    it('должен обрабатывать ошибку "Пароль неверен" и определять поле password', async () => {
      const error = new Error('Пароль неверен')
      error.userMessage = 'Пароль введен неверно'
      api.post.mockRejectedValue(error)

      const result = await login('test@example.com', 'wrongpass')

      expect(result.success).toBe(false)
      expect(result.field).toBe('password')
      expect(result.error).toBe('Пароль неверен')
    })

    it('должен обрабатывать ошибку "email не найден" и определять поле email', async () => {
      const error = new Error('Email не найден')
      error.userMessage = 'Пользователь не найден'
      api.post.mockRejectedValue(error)

      const result = await login('test@example.com', 'wrongpass')

      expect(result.success).toBe(false)
      expect(result.field).toBe('email')
      expect(result.error).toBe('Email не найден')
    })

    it('должен обрабатывать сбой сети', async () => {
      const error = new Error('Network Error')
      error.userMessage = 'Проблемы с сетью. Проверьте подключение.'
      api.post.mockRejectedValue(error)

      const result = await login('test@example.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network Error')
      expect(result.userMessage).toBe('Проблемы с сетью. Проверьте подключение.')
      expect(result.field).toBe('general')
    })
  })

  describe('register', () => {
    it('должен возвращать ошибку при невалидном email', async () => {
      const result = await register('invalid-email', 'ValidPass1!')
      
      expect(result).toEqual({
        success: false,
        error: 'Некорректный email. Проверьте формат.',
        field: 'email'
      })
    })

    it('должен возвращать ошибку при слабом пароле', async () => {
      const result = await register('test@example.com', 'weak')
      
      expect(result.success).toBe(false)
      expect(result.field).toBe('password')
      expect(result.error).toBeDefined()
    })

    it('должен возвращать ошибку если пароль без заглавной буквы', async () => {
      const result = await register('test@example.com', 'password123!')
      
      expect(result.success).toBe(false)
      expect(result.field).toBe('password')
      expect(result.error).toBe('Добавьте хотя бы одну заглавную букву')
    })

    it('должен возвращать ошибку если пароль без спецсимвола', async () => {
      const result = await register('test@example.com', 'Password123')
      
      expect(result.success).toBe(false)
      expect(result.field).toBe('password')
      expect(result.error).toBe('Добавьте хотя бы один специальный символ')
    })

    it('должен успешно регистрировать', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: {}
      })

      const result = await register('test@example.com', 'ValidPass1!')

      expect(api.post).toHaveBeenCalledWith('/auth/register', { 
        email: 'test@example.com', 
        password: 'ValidPass1!' 
      })
      
      expect(result.success).toBe(true)
      expect(result.message).toBe('Регистрация прошла успешно! Теперь войдите в систему.')
      expect(result.email).toBe('test@example.com')
    })

    it('должен обрабатывать ошибку "email уже существует"', async () => {
      api.post.mockResolvedValue({
        success: false,
        data: { message: 'Email already exists' }
      })

      const result = await register('existing@example.com', 'ValidPass1!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })

    it('должен обрабатывать ошибку сервера', async () => {
      const error = new Error('Server Error')
      error.userMessage = 'Ошибка сервера'
      api.post.mockRejectedValue(error)

      const result = await register('test@example.com', 'ValidPass1!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Server Error')
      expect(result.userMessage).toBe('Ошибка сервера')
    })
  })

  describe('checkAuth', () => {
    it('должен возвращать false если нет токена', () => {
      const result = checkAuth()
      expect(result).toEqual({ isAuthenticated: false })
    })

    it('должен возвращать false если нет email', () => {
      localStorage.setItem('token', 'test-token')
      
      const result = checkAuth()
      expect(result).toEqual({ isAuthenticated: false })
    })

    it('должен возвращать true если токен и email есть', () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('email', 'test@example.com')
      localStorage.setItem('auth_time', Date.now().toString())

      const result = checkAuth()
      expect(result).toEqual({
        isAuthenticated: true,
        email: 'test@example.com',
        token: 'test-token'
      })
    })

    it('должен предупреждать если токен скоро истекает (больше 6 дней)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('email', 'test@example.com')
      
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      localStorage.setItem('auth_time', sevenDaysAgo.toString())

      checkAuth()
      
      expect(consoleSpy).toHaveBeenCalledWith('Токен скоро истекает')
      consoleSpy.mockRestore()
    })
  })

  describe('logout', () => {
    it('должен удалять данные из localStorage', () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('email', 'test@example.com')
      localStorage.setItem('auth_time', Date.now().toString())
      localStorage.setItem('userCourses', '["1","2"]')

      const result = logout()

      expect(localStorage.getItem('token')).toBe(null)
      expect(localStorage.getItem('email')).toBe(null)
      expect(localStorage.getItem('auth_time')).toBe(null)
      expect(localStorage.getItem('userCourses')).toBe('["1","2"]')
      
      expect(result).toEqual({ success: true })
    })
  })
})