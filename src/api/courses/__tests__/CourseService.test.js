import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as CourseService from '../CourseService'
import api from '../../core/FitApi'

vi.mock('../../core/FitApi', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    clearCache: vi.fn()
  }
}))

describe('CourseService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getAllCourses', () => {
    it('должен возвращать курсы из кэша если они есть и не прошло 10 минут', async () => {
      const mockCourses = {
        success: true,
        data: [{ _id: '1', nameRU: 'Йога' }]
      }
      
      localStorage.setItem('all_courses', JSON.stringify({
        data: mockCourses,
        timestamp: Date.now() - 5 * 60 * 1000
      }))

      const result = await CourseService.getAllCourses()

      expect(result).toEqual(mockCourses)
      expect(api.get).not.toHaveBeenCalled()
    })

    it('должен запрашивать курсы если кэш устарел', async () => {
      const mockCourses = {
        success: true,
        data: [{ _id: '1', nameRU: 'Йога' }]
      }

      localStorage.setItem('all_courses', JSON.stringify({
        data: mockCourses,
        timestamp: Date.now() - 15 * 60 * 1000
      }))

      api.get.mockResolvedValue(mockCourses)

      const result = await CourseService.getAllCourses()

      expect(api.get).toHaveBeenCalledWith('/courses', {
        requiresAuth: false,
        useCache: true,
        cacheKey: 'courses_list'
      })
      expect(result).toEqual(mockCourses)
    })

    it('должен возвращать ошибку при неудачном запросе', async () => {
      const error = new Error('Network Error')
      error.userMessage = 'Не удалось загрузить курсы'
      api.get.mockRejectedValue(error)

      const result = await CourseService.getAllCourses()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Не удалось загрузить курсы')
    })
  })

  describe('addUserCourse', () => {
    it('должен успешно добавлять курс', async () => {
      api.post.mockResolvedValue({ success: true, data: {} })

      const result = await CourseService.addUserCourse('course-123')

      expect(api.post).toHaveBeenCalledWith(
        '/users/me/courses',
        { courseId: 'course-123' },
        { requiresAuth: true }
      )
      expect(result.success).toBe(true)
      expect(result.message).toBe('Курс добавлен в вашу коллекцию!')
    })

    it('должен определять дубликат курса', async () => {
      api.post.mockResolvedValue({
        success: false,
        data: { message: 'Курс уже добавлен' }
      })

      const result = await CourseService.addUserCourse('course-123')

      expect(result.isDuplicate).toBe(true)
      expect(result.message).toBe('Этот курс уже в вашей коллекции!')
    })

    it('должен обрабатывать ошибку при добавлении', async () => {
      api.post.mockResolvedValue({
        success: false,
        data: { message: 'Ошибка сервера' }
      })

      const result = await CourseService.addUserCourse('course-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ошибка сервера')
    })
  })

  describe('getUserCourses', () => {
    it('должен возвращать курсы пользователя из API', async () => {
      const mockCourses = {
        success: true,
        data: [{ _id: '1', nameRU: 'Йога' }]
      }

      api.get.mockResolvedValue(mockCourses)

      const result = await CourseService.getUserCourses()

      expect(api.get).toHaveBeenCalledWith('/users/me/courses', {
        requiresAuth: true,
        useCache: true,
        cacheKey: 'my_courses'
      })
      expect(result).toEqual(mockCourses)
    })

    it('должен возвращать курсы из кэша если они есть и не прошло 2 минуты', async () => {
      const mockCourses = {
        success: true,
        data: [{ _id: '1', nameRU: 'Йога' }]
      }
      
      localStorage.setItem('user_courses', JSON.stringify({
        data: mockCourses,
        timestamp: Date.now() - 1 * 60 * 1000
      }))

      const result = await CourseService.getUserCourses()

      expect(result).toEqual(mockCourses)
      expect(api.get).not.toHaveBeenCalled()
    })

    it('должен запрашивать курсы если кэш устарел', async () => {
      const mockCourses = {
        success: true,
        data: [{ _id: '1', nameRU: 'Йога' }]
      }

      localStorage.setItem('user_courses', JSON.stringify({
        data: mockCourses,
        timestamp: Date.now() - 3 * 60 * 1000
      }))

      api.get.mockResolvedValue(mockCourses)

      const result = await CourseService.getUserCourses(true)

      expect(api.get).toHaveBeenCalledWith('/users/me/courses', {
        requiresAuth: true,
        useCache: true,
        cacheKey: 'my_courses'
      })
    })

    it('должен сохранять ID курсов в localStorage', async () => {
      const mockCourses = {
        success: true,
        data: [
          { _id: '1', nameRU: 'Йога' },
          { _id: '2', nameRU: 'Стретчинг' }
        ]
      }

      api.get.mockResolvedValue(mockCourses)

      await CourseService.getUserCourses()

      const savedIds = JSON.parse(localStorage.getItem('userCourses'))
      expect(savedIds).toEqual(['1', '2'])
    })

    it('должен возвращать курсы из localStorage при ошибке API', async () => {
      localStorage.setItem('userCourses', JSON.stringify(['1', '2']))
      
      const error = new Error('Network Error')
      error.userMessage = 'Не удалось загрузить курсы'
      api.get.mockRejectedValue(error)

      const result = await CourseService.getUserCourses()

      expect(result.success).toBe(true)
      expect(result.fromCache).toBe(true)
      expect(result.data).toEqual([{ _id: '1' }, { _id: '2' }])
    })
  })

  describe('removeUserCourse', () => {
    it('должен успешно удалять курс', async () => {
      localStorage.setItem('userCourses', JSON.stringify(['1', '2', '3']))
      
      api.delete.mockResolvedValue({ success: true })

      const result = await CourseService.removeUserCourse('2')

      expect(api.delete).toHaveBeenCalledWith('/users/me/courses/2', {
        requiresAuth: true
      })
      expect(result.success).toBe(true)
      expect(result.message).toBe('Курс удален из вашей коллекции')
      
      const savedIds = JSON.parse(localStorage.getItem('userCourses'))
      expect(savedIds).toEqual(['1', '3'])
    })

    it('должен очищать кэш после удаления', async () => {
      localStorage.setItem('userCourses', JSON.stringify(['1', '2']))
      
      api.delete.mockResolvedValue({ success: true })

      await CourseService.removeUserCourse('2')

      expect(api.clearCache).toHaveBeenCalledWith('user_courses')
      expect(localStorage.getItem('user_courses')).toBe(null)
    })

    it('должен обрабатывать ошибку удаления', async () => {
      localStorage.setItem('userCourses', JSON.stringify(['1', '2']))
      
      api.delete.mockResolvedValue({
        success: false,
        data: { message: 'Курс не найден' }
      })

      const result = await CourseService.removeUserCourse('999')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Курс не найден')
      
      const savedIds = JSON.parse(localStorage.getItem('userCourses'))
      expect(savedIds).toEqual(['1', '2'])
    })

    it('должен обрабатывать ошибку сети при удалении', async () => {
      localStorage.setItem('userCourses', JSON.stringify(['1', '2']))
      
      const error = new Error('Network Error')
      error.userMessage = 'Не удалось удалить курс. Попробуйте еще раз.'
      api.delete.mockRejectedValue(error)

      const result = await CourseService.removeUserCourse('2')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Не удалось удалить курс. Попробуйте еще раз.')
    })
  })

  describe('getCourseById', () => {
    it('должен возвращать курс по ID', async () => {
      const mockCourse = {
        success: true,
        data: { _id: '123', nameRU: 'Йога' }
      }

      api.get.mockResolvedValue(mockCourse)

      const result = await CourseService.getCourseById('123')

      expect(api.get).toHaveBeenCalledWith('/courses/123', {
        useCache: true,
        cacheKey: 'course_123'
      })
      expect(result).toEqual(mockCourse)
    })

    it('должен обрабатывать ошибку при получении курса', async () => {
      const error = new Error('Network Error')
      error.userMessage = 'Не удалось загрузить курс'
      api.get.mockRejectedValue(error)

      const result = await CourseService.getCourseById('123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Не удалось загрузить курс')
      expect(result.courseId).toBe('123')
    })
  })

  describe('refreshCoursesCache', () => {
    it('должен очищать кэш курсов', () => {

      localStorage.setItem('all_courses', 'test')
      localStorage.setItem('user_courses', 'test')
      
      CourseService.refreshCoursesCache()

      expect(localStorage.getItem('all_courses')).toBe(null)
      expect(localStorage.getItem('user_courses')).toBe(null)
      expect(api.clearCache).toHaveBeenCalled()
    })
  })
})