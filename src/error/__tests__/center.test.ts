import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorCenter } from '../center'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

vi.mock('element-plus', () => ({
  ElMessage: vi.fn(),
  ElNotification: vi.fn(),
  ElMessageBox: {
    alert: vi.fn().mockResolvedValue('ok')
  }
}))

vi.mock('../bus', () => ({
  default: {
    subscribe: vi.fn()
  }
}))

describe('ErrorCenter', () => {
  let center: ErrorCenter
  
  beforeEach(() => {
    vi.clearAllMocks()
    center = new ErrorCenter()
    center.init()
  })
  
  it('should handle system error and show toast', () => {
    center.handle({
      code: 'NETWORK_ERROR',
      level: 'error',
      display: 'toast',
      message: 'Network error'
    })
    
    expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      message: expect.stringContaining('Network error')
    }))
  })
  
  it('should handle unhandled error', () => {
    center.handleUnknown(new Error('Boom!'))
    expect(ElNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      message: expect.stringContaining('Boom!')
    }))
  })
  
  it('should deduplicate errors', () => {
    const err = { code: 'DUP', message: 'msg' }
    center.handle(err)
    center.handle(err)
    
    // Default UNHANDLED display is notification
    expect(ElNotification).toHaveBeenCalledTimes(1)
  })

  it('should respect silent flag', () => {
    center.handle({ code: 'TEST', silent: true })
    expect(ElMessage).not.toHaveBeenCalled()
    expect(ElNotification).not.toHaveBeenCalled()
  })

  it('should bind to Vue error handler', () => {
    const mockApp = {
      config: {
        errorHandler: null
      }
    }
    const localCenter = new ErrorCenter()
    localCenter.init({ app: mockApp as any })
    expect(mockApp.config.errorHandler).toBeDefined()
    
    // Trigger it
    const err = new Error('Vue Error')
    // @ts-expect-error mock
    mockApp.config.errorHandler(err, {}, 'created hook')
    
    expect(ElNotification).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Vue Error')
    }))
  })

  it('should bind to window events', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const localCenter = new ErrorCenter()
    localCenter.init()
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function))
    
    // Trigger handlers if possible
    const unhandledHandler = addEventListenerSpy.mock.calls.find(c => c[0] === 'unhandledrejection')![1]
    const errorHandler = addEventListenerSpy.mock.calls.find(c => c[0] === 'error')![1]
    
    // @ts-expect-error mock
    unhandledHandler({ reason: new Error('Promise Rejection') })
    expect(ElNotification).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Promise Rejection')
    }))
    
    // @ts-expect-error mock
    errorHandler({ message: 'Script Error', filename: 'test.js', lineno: 1, colno: 1, error: new Error('Script Error') })
    expect(ElNotification).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Script Error')
    }))
  })
})
