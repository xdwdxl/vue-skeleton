import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorNotifier } from '../notifier'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

vi.mock('element-plus', () => ({
  ElMessage: vi.fn(),
  ElNotification: vi.fn(),
  ElMessageBox: {
    alert: vi.fn().mockResolvedValue('ok')
  }
}))

describe('ErrorNotifier', () => {
  let notifier: ErrorNotifier

  beforeEach(() => {
    vi.clearAllMocks()
    notifier = new ErrorNotifier()
  })

  it('should ignore none/inline display', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'error',
      display: 'none',
      ts: 0,
      tags: {}
    })
    expect(ElMessage).not.toHaveBeenCalled()
    
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'error',
      display: 'inline',
      ts: 0,
      tags: {}
    })
    expect(ElMessage).not.toHaveBeenCalled()
  })

  it('should show toast', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'error',
      display: 'toast',
      ts: 0,
      tags: {}
    })
    expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      message: 'msg\ncode: TEST'
    }))
  })

  it('should show toast with warn level', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'warn',
      display: 'toast',
      ts: 0,
      tags: {}
    })
    expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'warning'
    }))
  })

  it('should show notification', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'error',
      display: 'notification',
      ts: 0,
      tags: {}
    })
    expect(ElNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      message: 'msg\ncode: TEST'
    }))
  })
  
  it('should show fatal notification', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'fatal',
      display: 'notification',
      ts: 0,
      tags: {}
    })
    expect(ElNotification).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      title: 'Error',
      duration: 0
    }))
  })

  it('should show dialog', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'error',
      display: 'dialog',
      ts: 0,
      tags: {}
    })
    expect(ElMessageBox.alert).toHaveBeenCalledWith(
      expect.stringContaining('msg'),
      'Notice',
      expect.objectContaining({ type: 'error' })
    )
  })

  it('should include details in message', () => {
    notifier.notify({
      code: 'TEST',
      message: 'msg',
      level: 'error',
      display: 'toast',
      status: 404,
      requestId: 'req-1',
      traceId: 'trace-1',
      ts: 0,
      tags: {}
    })
    expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('requestId: req-1')
    }))
    expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('traceId: trace-1')
    }))
    expect(ElMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('status: 404')
    }))
  })
})
