import Schedule from './schedule'

/**
 * 对接后端接口
 * 当计划任务执行则提交数据到后端接口
 */
const schedule = new Schedule()

export default {
  start () {
    schedule.start()
  },

  stop () {
    schedule.stop()
  },

  push (formId, type) {
    typeof formId === 'string' &&
    formId.length > 0 &&
    formId !== 'the formId is a mock one' &&
    schedule.push({
      formId,
      type,
      createTime: Date.now()
    })
  },

  report (formId, type) {
    schedule.report([{
      formId,
      type,
      createTime: Date.now()
    }])
  },

  onExcuted (handleExcuted) {
    schedule.onExcuted(handleExcuted)
  }
}
