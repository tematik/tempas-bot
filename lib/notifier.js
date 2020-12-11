const notifier = require('node-notifier')

module.exports = {
  log: (type, opts) => {
    if (opts instanceof Error) {
      console.error(type, opts)

      return notifier
    }

    console.log(type, JSON.stringify(opts))

    if (!opts.title) {
      opts.title = 'Shopee Buyer'
    }

    if (opts.message) {
      notifier.notify(opts)
    }

    return notifier
  }
}
