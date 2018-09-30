# Collector - FORM ID 收集器

收集器包括 Schedule （计划任务类）和 collector （收集器组件）两部分组成。

## From id 收集

因为利用 form id 才能通过微信公众号推送消息，因此我们可以通过部分用户点击操作进行 formId 采集。

## 使用

在 `app.json` 添加以下代码

```json
{
  "plugins": {
    "formid-collector": {
      "version": "dev",                 // 改成相应的 version
      "provider": "wxe91685411de8a15c"  // 改成相应的 provider
    }
  }
}
```

在 `page/[my page].json` 引入以下代码

```json
{
  "usingComponents": {
    "collector": "plugin://formid-collector/formid-collector"
  }
}
```

因为这里一项服务，因此不需要与 `App`, `Page`, `Component` 有任何关联，
因此可以在 `app.js` 中初始化收集服务

```js
const interval = 6e3
const report = (data) => {
  return new Promise((resolve) => {
    // report my form id to server
  })
}

const formIdCollectorService = requirePlugin('formid-collector').create({ interval })

formIdCollectorService.onExcuted(report)
formIdCollectorService.start()
```

这时初始化完毕，在需要的地方引用组件

```js
<collector url="/path/to/page">Redirect</collector>
```

## 组成部分

### Schedule - 计划任务

为了缓解服务器压力，所以收集到的 formId 会通过定时任务统一时间进行提交。

#### 特点

- 所有任务列表都会存储在 `wx.storage` 中。
- 第一个任务会立即执行。
- 后面提交的任务都会统一在下一个60秒后执行
  - 如果用户60秒钟内退出小程序，则任务会在世界时间60秒后的下一次进入小程序立即执行
- 支持重试
- 支持上锁
  - 上锁后无法触发 `excute` (执行) 和 `clean` (清除任务列表)

### Collector - 收集器组件

因为 form id 需要使用 Form 表单才能获取，而且不能跟 `navigator` 组件同时使用
因此很多情况下会出现需要跳转的情况，这里也结合 `navigator` 组件的跳转功能。
我们可以通过简单的配置 `url` `openType` `delta` 来确定跳转。

* 因为很多情况都只是跳转，所以并没有将 `navigator` 的所有功能都迁移过来，若需要则可以往下添加

## 注意

- Form Id 只能存活 7天，且只能支持一次消息推送
- Form Id 收集只能通过提交 Form 表单获取
  - 开发工具只会出现 `the formId is a mock one`
