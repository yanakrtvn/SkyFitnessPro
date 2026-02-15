import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import * as AuthService from '../../api/auth/AuthService'

vi.mock('../../api/auth/AuthService', () => ({
  login: vi.fn(),
  register: vi.fn()
}))

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('должен инициализироваться с пользователем если есть токен', async () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('email', 'test@example.com')

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({
      email: 'test@example.com',
      token: 'test-token'
    })
  })

  it('должен успешно логиниться', async () => {
    const mockLoginResult = {
      success: true,
      token: 'new-token'
    }
    AuthService.login.mockResolvedValue(mockLoginResult)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let loginResult
    await act(async () => {
      loginResult = await result.current.login('test@example.com', 'password')
    })

    expect(loginResult).toEqual(mockLoginResult)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user.email).toBe('test@example.com')
  })

  it('должен разлогиниваться', async () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('email', 'test@example.com')

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
    expect(localStorage.getItem('token')).toBe(null)
  })
})