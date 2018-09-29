App({
  onLaunch () {

  }
})

const report = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(data)
      resolve()
    }, 500)
  })
}

collectorService.onExcuted(report)
collectorService.start()
