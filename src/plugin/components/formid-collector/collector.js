import Service from './service'

Component({
  properties: {
    /**
     * 上报类型
     * 0：普通表单，1：支付
     *
     * @type {Number}
     */
    type: {
      type: Number,
      value: 0
    },
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
    }
  },
  methods: {
    handleCollect (event) {
      let { formId } = event.detail
      if (formId === 'the formId is a mock one') return
      let { immediately, type } = this.properties
      immediately ? Service.report(formId, type) : Service.push(formId, type)
    }
  }
})
