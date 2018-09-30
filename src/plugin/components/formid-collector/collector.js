import { schedule } from '../../index'

/**
 * 组件属性
 *
 * @type {Object}
 */
const properties = {
  /**
   * 跳转地址
   * 默认值为空字符串则默认不跳转
   *
   * @type {String}
   */
  url: {
    type: String,
    value: ''
  },
  /**
   * 跳转类型
   * 默认值为 navigate
   * 对接小程序 navigator 组件的 openType 属性, 具体参数参考小程序文档
   *
   * @see https://developers.weixin.qq.com/miniprogram/dev/component/navigator.html
   * @type {String}
   */
  openType: {
    type: String,
    value: 'navigate'
  },
  /**
   * 当 openType 为 navigateBack 则设置为返回的层级
   * 默认值为 1
   * 对接小程序 navigator 组件的 delta 属性, 具体参数参考小程序文档
   *
   * @see https://developers.weixin.qq.com/miniprogram/dev/component/navigator.html
   * @type {Number}
   */
  delta: {
    type: Number,
    value: 1
  },
  /**
   * 立即上传
   *
   * @type {Boolean}
   */
  immediately: {
    type: Boolean,
    value: false
  },
  /**
   * 额外值
   *
   * @type {Object}
   */
  extra: {
    type: Object,
    value: {}
  }
}

/**
 * 组件方法
 *
 * @type {Object}
 */
const methods = {
  /**
   * 阻止冒泡
   *
   * @return {Boolean} false
   */
  stopPropagation () {
    return false
  },

  /**
   * 收集 Form Id
   *
   * @param {String} form id
   */
  collect (formId) {
    let { immediately, extra } = this.properties
    immediately ? schedule.report(formId, extra) : schedule.push(formId, extra)
  },

  /**
   * 处理收集 Form Id
   *
   * @param {Object} event
   */
  handleCollect (event) {
    let { formId } = event.detail || {}
    this.collect(formId)
  },

  /**
   * 重定向
   * 因为跳转无法收集 form id，
   * 因此这里提供了一种方便的形式去进行跳转
   */
  redirect () {
    let { url, openType, delta } = this.properties
    if (!url) {
      return
    }

    switch (openType) {
      case 'navigate': {
        wx.navigateTo({ url })
        break
      }

      case 'redirect': {
        wx.redirectTo({ url })
        break
      }

      case 'switchTab': {
        wx.switchTab({ url })
        break
      }

      case 'reLaunch': {
        wx.reLaunch({ url })
        break
      }

      case 'navigateBack': {
        wx.navigateBack({ url, delta })
        break
      }

      default: {
        wx.navigateTo({ url })
      }
    }
  }
}

Component({ properties, methods })
