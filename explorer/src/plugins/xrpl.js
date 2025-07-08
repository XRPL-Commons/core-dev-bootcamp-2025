import { XrplClient } from 'xrpl-client'

export default {
  async install (Vue, options) {
    let _endpoint = process?.env?.VUE_APP_WSS_ENDPOINT
    const customEndpoint = _endpoint

    // console.log({
    //   _endpoint,
    //   customEndpoint
    // })

    if (customEndpoint !== '') _endpoint = options.router.options.endpoint = customEndpoint
    const endpoint = String(_endpoint || '')
    // console.log(endpoint)
    Vue.prototype.$ws = new XrplClient(endpoint)
    Vue.prototype.$localnet = false

    Vue.prototype.$ws.send({ command: 'server_info' }).then(r => {
      Vue.prototype.$localnet = r?.info?.last_close?.proposers === 0
      if (Vue.prototype.$localnet) {
        Vue.prototype.$events.emit('islocalnet', true)
      }
    })

    const net = {
      live: endpoint === '' || endpoint.match(/xrplcluster|xrpl\.ws|xrpl\.link|s[12]\.ripple\.com/),
      test: endpoint.match(/rippletest|\/testnet\.xrpl-labs/),
      xahaulive: endpoint.match(/xahau.*network/),
      xahautest: endpoint.match(/xahau.*test/),
      custom: endpoint.match(/localhost/)
    }

    Vue.prototype.$net = net

    Vue.prototype.$ws.on('ledger', ledger => Vue.prototype.$events.emit('ledger', ledger))
    // console.info('Connecting @ `plugins/xrpl`')
    await Vue.prototype.$ws.ready()
    const state = Vue.prototype.$ws.getState()
    // console.info('Connected @ `plugins/xrpl`', state.server)
    Vue.prototype.$events.emit('connected', state.server.publicKey)
  }
}
