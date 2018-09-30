App({})

const interval = 6e3
const report = (data) => {
  return new Promise((resolve) => {
    console.table(data)
    time = interval / 1000
    setTimeout(resolve, 500)
  })
}

const formIdCollectorService = requirePlugin('formid-collector').create({ interval })

formIdCollectorService.onExcuted(report)
formIdCollectorService.start()

let time = interval / 1000
setInterval(() => time > 0 && console.log(`还有${-- time}秒开始上传 Form Id`), 1e3)
