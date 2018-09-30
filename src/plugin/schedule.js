/**
 * 计划任务类
 * 合并多个任务并在单位时间内统一处理
 * 通过`防抖动`原理控制任务不会多次触发，
 * 而是在统一单位时间内执行
 */
export default class Schedule {
  /**
   * 默认配置
   *
   * @type {Object}
   */
  static defaultSettings = {
    // 本地存储的键值
    token: 'schedule@formIdCollector',
    // 间隔时间, 默认: 60秒
    interval: 60e3,
    // 超时时间, 默认: 30秒
    timeout: 30e3,
    // 重试时间，默认: 3秒
    retryTime: 3e3
  }

  /**
   * 获取任务
   *
   * @type {Object}
   */
  get schedule () {
    let { token } = this.settings
    let schedule = wx.getStorageSync(token)
    return schedule
  }

  /**
   * 获取所有任务
   *
   * @type {Array}
   */
  get tasks () {
    let { tasks } = this.schedule
    return tasks || []
  }

  /**
   * 构造函数
   *
   * @param {Object} options 配置信息
   * @param {String} options.token 本地存储的键值
   * @param {SafeInteger} options.interval 本地存储的键值
   * @param {SafeInteger} options.timeout 本地存储的键值
   * @param {SafeInteger} options.retryTime 本地存储的键值
   */
  constructor (options) {
    this.running = false
    this.loop = Function.prototype
    this.excutePromise = null
    this.handlers = []

    this.setOptions(options)
  }

  /**
   * 设置
   *
   * @param {Object} options 配置信息
   * @param {String} options.token 本地存储的键值
   * @param {SafeInteger} options.interval 本地存储的键值
   * @param {SafeInteger} options.timeout 本地存储的键值
   * @param {SafeInteger} options.retryTime 本地存储的键值
   */
  setOptions (options = {}) {
    this.settings = Object.assign({}, Schedule.defaultSettings, options)
  }

  /**
   * 开始执行
   *
   * @return {Boolean} 是否响应启动
   */
  start () {
    if (this.running === true) {
      return false
    }

    this.running = true

    this.loop = () => this.nextTask().then(this.loop).catch(() => {
      /**
       * 这里 catch 不代表失败，代表没有到上传时间，等返回的 reject 事件
       * 上传错误超时等，会进行 retry 下面 report 函数里面做相应操作
       */
      const { interval } = this.settings
      this.timeId && clearTimeout(this.timeId)
      this.timeId = setTimeout(this.loop.bind(this), interval)
    })

    this.loop()

    return true
  }

  /**
   * 结束执行
   *
   * @return {Boolean} 是否响应关闭
   */
  stop () {
    if (this.running === false) {
      return false
    }

    this.loop = Function.prototype
    this.excutePromise && this.excutePromise.cancel()
    this.running = false

    return true
  }

  /**
   * 监听定时任务执行
   *
   * @param {Function} handler 处理函数
   */
  onExcuted (handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('handler is not a function or not be provided.')
    }

    this.handlers.push(handler)
  }

  /**
   * 下一个任务
   */
  nextTask () {
    this.killDead()

    let { token, interval } = this.settings
    let schedule = wx.getStorageSync(token)

    if (!schedule) {
      return Promise.reject(new Error('Schedule is not found'))
    }

    let { tasks, cd, locked } = schedule
    if (!tasks || tasks.length === 0 || locked === true) {
      return Promise.reject(new Error('Schedule is empty or locked'))
    }

    let nowTime = Date.now()
    if (cd > nowTime) {
      return new Promise((resolve) => {
        let nextTime = cd - nowTime
        // 避免本地时间错误 (超大) 导致无法执行，这里做一个容错处理
        if (nextTime > interval) {
          nextTime = Date.now() + interval
        }

        this.timeId && clearTimeout(this.timeId)
        this.timeId = setTimeout(() => this.excute(tasks).then(resolve).catch(resolve), nextTime)
      })
    }

    /**
     * 这里如果超过 `interval` 没有执行任务或者第一次添加任务
     * 而第一次/下一次添加任务会立即执行一次处理
     * 其实就是做一下`防抖动`处理
     */
    return this.excute(tasks)
  }

  /**
   * 执行任务队列
   *
   * @param {Array} tasks 任务队列
   */
  excute (tasks) {
    return new Promise((resolve) => {
      let { token, interval } = this.settings
      if (!Array.isArray(tasks)) {
        let schedule = wx.getStorageSync(token)
        if (!schedule) {
          resolve()
          return
        }

        tasks = schedule.tasks || []
      }

      if (tasks.length === 0) {
        resolve()
        return
      }

      /**
       * 避免异步情况，执行任务队列的时候需要上锁
       */
      this.lock(true)

      let data = tasks.map((task) => task.data)
      this.excutePromise = this.report(data)

      this.excutePromise.then(() => {
        this.excutePromise = null

        this.plan(interval)
        this.remove(tasks, true)
        this.lock(false)

        resolve()

      }).catch(() => {
        this.excutePromise = null

        // 先解锁，后重试，否则会任务表会被锁住，导致无法再执行
        this.lock(false)
        return this.retry()
      })
    })
  }

  /**
   * 提交报告
   *
   * @param {Object} data 数据
   * @return {Promise}
   */
  report (data) {
    let { timeout } = this.settings

    let cancelThisPromise
    let promise = new Promise((resolve, reject) => {
      cancelThisPromise = () => reject(new Error('It has been canceled'))

      let promises = this.handlers.map((fn) => fn.call(this, data))
      return Promise.all(promises).then(resolve).catch(reject)
    })

    promise.cancel = cancelThisPromise

    let clearTimer = () => timeId && clearTimeout(timeId)
    promise.then(clearTimer).catch(clearTimer)

    /**
     * 处理超时情况
     */
    let timeId = setTimeout(() => promise.cancel(), timeout)
    return promise
  }

  /**
   * 推送新任务
   *
   * @param {Any} task 任务
   */
  push (data) {
    if (!data) {
      return
    }

    let { token } = this.settings
    let schedule = wx.getStorageSync(token) || {}

    // 如果没有时间，则插入当前时间，尽快执行第一个任务
    schedule.cd = Number.isSafeInteger(schedule.cd) ? schedule.cd : Date.now()
    schedule.locked = typeof schedule.locked === 'boolean' ? schedule.locked : false

    let task = { data, id: guid() }
    schedule.tasks = (schedule.tasks || []).concat([task])
    wx.setStorageSync(token, schedule)
  }

  /**
   * 修改下一个任务时间
   * 不受锁表影响
   *
   * @param {Integer} nextTime 下一个任务时间
   */
  plan (nextTime) {
    let { token, interval } = this.settings
    if (!Number.isSafeInteger(nextTime)) {
      nextTime = interval
    }

    let schedule = wx.getStorageSync(token) || {}
    schedule.cd = Date.now() + nextTime

    wx.setStorageSync(token, schedule)
  }

  /**
   * 重试
   * 默认三秒重试
   */
  retry () {
    let { retryTime } = this.settings
    retryTime = retryTime || 3e3

    this.plan(retryTime)

    return new Promise((resolve, reject) => {
      let nextTask = () => this.nextTask().then(resolve).catch(reject)
      setTimeout(nextTask, retryTime)
    })
  }

  /**
   * 删除任务
   * 锁表后不能删除任务，否则失败就无法重试
   *
   * @param {Any|Array} tasks 任务
   * @param {Boolean} force 强制执行，不受锁表影响
   */
  remove (tasks, force = false) {
    tasks = Array.isArray(tasks) ? tasks : [tasks]
    if (tasks.length === 0) {
      return
    }

    let { token } = this.settings
    let schedule = wx.getStorageSync(token) || {}
    if (schedule.locked === true && force !== true) {
      return
    }

    if (!(Array.isArray(schedule.tasks) && schedule.tasks.length > 0)) {
      return
    }

    schedule.tasks = schedule.tasks.filter((curTask) => !tasks.find((task) => task.id === curTask.id))
    wx.setStorageSync(token, schedule)
  }

  /**
   * 清除所有任务列表
   * 锁表后不能清除，否则容易出现
   * 失败后数据丢失
   * @param {Boolean} force 强制执行，不受锁表影响
   */
  clear (force = false) {
    let { token, interval } = this.settings
    let schedule = wx.getStorageSync(token) || {}
    if (schedule.locked === true && force !== true) {
      return
    }

    schedule.cd = Date.now() + interval
    schedule.tasks = []
    schedule.locked = false

    wx.setStorageSync(token, schedule)
  }

  /**
   * 上锁
   * 上锁后无法触发执行/清除任务列表
   * 但可以添加任务
   * @param {any} isOpen
   */
  lock (isOpen) {
    let { token } = this.settings
    let schedule = wx.getStorageSync(token)
    if (!schedule) {
      return
    }

    schedule.locked = !!isOpen
    wx.setStorageSync(token, schedule)
  }

  /**
   * 清除死亡的锁
   */
  killDead () {
    let { token, interval, timeout, retryTime } = this.settings
    let schedule = wx.getStorageSync(token)
    if (!schedule) {
      return
    }

    if (schedule.locked !== true) {
      return
    }

    /**
     * 从 轮训，超时，重试 三个维度的时间抽出最大花费的时间
     * 若当前时间减去下一次任务时间大于最大花费的时间，则解锁
     * 否则退出导致锁仍存在则无法执行
     */
    let maxSpendTime = Math.max(interval, timeout, retryTime)
    Date.now() - schedule.cd > maxSpendTime && this.lock(false)
  }
}

/**
 * 生成 uid
 * @return {String} Unique ID
 */
function guid () {
  let firstPart = (Math.random() * 46656) | 0
  let secondPart = (Math.random() * 46656) | 0

  firstPart = ('000' + firstPart.toString(36)).slice(-3)
  secondPart = ('000' + secondPart.toString(36)).slice(-3)
  return firstPart + secondPart
}
