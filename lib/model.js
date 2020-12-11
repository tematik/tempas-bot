const storage = require('./storage')

class Model {
  constructor(attributes = {}) {
    this.attributes = new Map()
  }
  _init(attributes = {}) {
    this.fillDefault()
    this.load()
    this.fill(attributes)
  }
  fillDefault() {
    for (const key in this.schema) {
      const defaultValue = this.schema[key].defaultValue

      if (typeof defaultValue === 'function') {
        this.attributes.set(key, defaultValue.call(this))
      } else if ('defaultValue' in this.schema[key]) {
        this.attributes.set(key, defaultValue)
      }
    }

    return this
  }
  fill(attributes = {}) {
    for (const key in attributes) {
      const value = attributes[key]

      if (this.isValidSchema(key, value)) {
        this.attributes.set(key, value)
      }
    }

    return this
  }
  isValidSchema(key, value) {
    if (this.schema[key] && this.schema[key].type) {
      const type = this.schema[key].type

      if (type === String) {
        return String(value) === value
      }

      if (type === Number) {
        return Number(value) === value
      }

      if (type === Array) {
        return Array.isArray(value)
      }

      if (type === Object) {
        return typeof value === 'object' && value !== null
      }

      if (type === Boolean) {
        return Boolean(value) === value
      }
    }

    return true
  }
  save() {
    const attributes = {}

    this.attributes.forEach((v, k) => {
      if (this.schema[k] && typeof this.schema[k].onSave === 'function') {
        v = this.schema[k].onSave(v)
      }

      attributes[k] = v
    })
 
    storage.set(this.name, attributes).write()

    return this
  }
  load() {
    const values = storage.get(this.name).value()

    if (values) {
      for (const key in values) {
        let value = values[key]

        if (this.schema[key] && typeof this.schema[key].onLoad === 'function') {
          value = this.schema[key].onLoad(value)
        }

        this.attributes.set(key, value)
      }
    }

    return this
  }
  toJSON() {
    const attributes = {}

    this.attributes.forEach((v, k) => {
      attributes[k] = v
    })

    return attributes
  }
}

class BrowserProfile extends Model {
  constructor(attributes = {}) {
    super(attributes)
    this.name = 'browser_profile'

    this.schema = {
      name: {
        type: String,
        defaultValue: 'default'
      },
      width: {
        type: Number,
        defaultValue: 1440
      },
      height: {
        type: Number,
        defaultValue: 900
      },
      device_scale_factor: {
        type: Number,
        defaultValue: 2.2
      },
      is_mobile: {
        type: Boolean,
        default: false
      },
      has_touch: {
        type: Boolean,
        defaultValue: false
      },
      is_landscape: {
        type: Boolean,
        defaultValue: true
      },
      incognito: {
        type: Boolean,
        defaultValue: false
      },
      user_agent: {
        type: String,
        defaultValue: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
      },
      proxy_host: {
        type: String
      },
      proxy_port: {
        type: Number
      },
      proxy_user: {
        type: String
      },
      proxy_pass: {
        type: String
      },
      ws_endpoint: {
        type: String
      }
    }

    this._init(attributes)
  }
}

class Credential extends Model {
  constructor(attributes = {}) {
    super(attributes)

    this.name = 'credential'

    this.schema = {
      browser_name: {
        type: String
      },
      key: {
        type: String,
        defaultValue: 'default'
      },
      username: {
        type: String
      },
      password: {
        type: String,
        onSave: (value) => {
          if (value) {
            return Buffer.from(value).toString('base64')
          }
        },
        onLoad: (value) => {
          if (value) {
            return Buffer.from(value, 'base64').toString()
          }

          return ''
        }
      },
      email: {
        type: String
      }
    }

    this._init(attributes)
  }
}

module.exports = {
  BrowserProfile,
  Credential,
  instance: () => {
    return {
      BrowserProfile: new BrowserProfile(),
      Credential: new Credential()
    }
  }
}