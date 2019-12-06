const getHostInput = () => document.getElementById('host')
const getPortInput = () => document.getElementById('port')

function report(s) {
  const status = document.getElementById('status')
  status.innerText = s
}

function updateCurrent() {
  chrome.proxy.settings.get(
    {},
    x => {
      const current = document.getElementById('current')
      current.innerText = JSON.stringify(x, null, 2)
    }
  )
}

function afterChange() {
  report('Changed')
  updateCurrent()
}

document.getElementById('set').addEventListener('click', () => {
  const hostport = getHostInput().value.split(':')
  const portInput = getPortInput()

  if (hostport[1]) portInput.value = ''

  const portRaw = hostport[1] || portInput.value

  const host = hostport[0]
  const port = Number(portRaw)

  chrome.storage.local.set({host, port})

  if (isNaN(port)) {
    report('Port must be a number')
    return
  }

  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: 'http',
        host,
        port,
      }
    }
  }

  chrome.proxy.settings.set(
    {
      value: config,
      scope: 'regular',
    },
    afterChange
  )
})

document.getElementById('clear').addEventListener('click', () => {
  chrome.proxy.settings.clear(
    {scope: 'regular'},
    afterChange
  )
})

chrome.proxy.onProxyError.addListener(e => {
  const prefix = e.fatal ? '[FATAL] ' : ''
  report(`${prefix}${e.error} (${e.details})`)
})

updateCurrent()

chrome.storage.local.get(['host', 'port'], x => {
  getHostInput().value = x.host || ''
  getPortInput().value = x.port || ''

  document.getElementById('loading').style.display = 'none'
})
