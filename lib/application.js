const model = require('./model')
const notifier = require('./notifier')

let SERVICE_INSTANCES = global.SERVICE_INSTANCES

async function application() {
  if (SERVICE_INSTANCES) {
    return SERVICE_INSTANCES
  }

  SERVICE_INSTANCES = {
    notifier,
    model: model.instance()
  }

  return SERVICE_INSTANCES
}

module.exports = application