import Schedule from './schedule'

/**
 * 对接后端接口
 * 当计划任务执行则提交数据到后端接口
 */

let schedule = null
let instance = {
  start () {
    schedule.start()
  },
  stop () {
    schedule.stop()
  },
  push (formId, params = {}) {
    let _push = () => {
      let createTime = Date.now()
      schedule.push({ formId, ...params, createTime })
    }

    if (process.env.NODE_ENV === 'production') {
      if (typeof formId === 'string' && formId.length && formId !== 'the formId is a mock one') {
        _push()
      }
    } else {
      _push()
    }
  },
  report (formId, params = {}) {
    let _report = () => {
      let datas = []
      let createTime = Date.now()
      datas.push({ formId, ...params, createTime })
      schedule.report(datas)
    }

    if (process.env.NODE_ENV === 'production') {
      if (typeof formId === 'string' && formId.length && formId !== 'the formId is a mock one') {
        _report()
      }
    } else {
      _report()
    }
  },
  onExcuted (handleExcuted) {
    schedule.onExcuted(handleExcuted)
  }
}

export const create = function (options) {
  if (!schedule) {
    schedule = new Schedule(options)
  }

  return instance
}

Object.defineProperty(exports, 'schedule', {
  get: () => instance
})
