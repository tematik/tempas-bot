const puppeteer = require('puppeteer')
const StealthPage = require('./puppeteer-stealth')
const appRootPath = require('app-root-path')
const PROFILE_PATH = appRootPath + '/storage/profiles'
const { delay } = require('./util')

class Puppeteer {
  constructor(app) {
    this.opts = { 
      defaultTimeout: 60000,
      headless: process.env.PPTR_HEADLESS ? JSON.parse(process.env.PPTR_HEADLESS) : false,
      ...app.model.BrowserProfile.toJSON(),
    }

    this.opts.device_scale_factor = this.opts.device_scale_factor ? parseFloat(this.opts.device_scale_factor) : null

    this.stealthPage = new StealthPage(this.opts, this)
    this.browser = null
    this.lastPage = null

    this.model = app.model.BrowserProfile

    this.notifier = app.notifier
    this._lastConnectionUseExisting = null
  }
  config() {
    let config = {
      devtools: this.opts.headless ? false : true,
      ignoreHTTPSErrors: true,
      timeout: this.opts.defaultTimeout,
      defaultViewport: {
        width: this.opts.width,
        height: this.opts.height,
        // deviceScaleFactor: this.opts.device_scale_factor,
        isMobile: this.opts.is_mobile,
        hasTouch: this.opts.has_touch,
        isLandscape: this.opts.is_landscape
      },
      userDataDir: PROFILE_PATH + '/' + this.opts.name,
      args: [
        '--ignore-certificate-errors',
        '--no-first-run',
        '--window-position=0,0',
        '--ignore-certificate-errors-spki-list',

        '--disable-background-timer-throttling',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-cloud-import',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-gesture-typing',
        '--disable-hang-monitor',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-offer-upload-credit-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--disable-tab-for-desktop-share',
        '--disable-translate',
        '--disable-voice-input',
        '--disable-wake-on-wifi',
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--enable-tcp-fast-open',
        '--enable-webgl',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--media-cache-size=33554432',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--prerender-from-omnibox=disabled',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
      ]
    }

    return config
  }
  async _launchPuppeteer() {
    this.browser = await puppeteer.launch(this.config())
    this.model.attributes.set('ws_endpoint', this.browser.wsEndpoint())
    await this.model.save()
  }
  async launch() {
    let shouldNotifyOnConnect = false

    if (this.model.attributes.has('ws_endpoint')) {
      try {
        this.browser = await this.reconnect()

        if (this.browser) {
          shouldNotifyOnConnect = true
          this._lastConnectionUseExisting = true
        }
      } catch (err) {}
    }

    if (!this.browser) {
      await this._launchPuppeteer()
    }

    this.browser.on('disconnected', async () => {
      if (this.page && typeof this.page.close === 'function') {
        await this.page.close()
      }
      this.model.attributes.delete('ws_endpoint')
      await this.model.save()
      await this.notifier.log('browser:disconnected:response', this.model.toJSON())
      process.exit()
    })

    // process.on('beforeExit', async () => {
    //   if (this.lastPage) {
    //     await this.lastPage.exit()
    //   }
    //   this.model.ws_endpoint = null
    //   await this.model.save()
    //   await this.notifier.log('browser:disconnected:response', this.model.toJSON())
    // })

    process.on('exit', async () => {
      try {
        if (this.lastPage && typeof this.lastPage.close === 'function') {
          await this.lastPage.close()
        }
      } catch (err) {
        console.error('Error before exit, failed to close last page', err)
      }

      this.model.attributes.delete('ws_endpoint')
      await this.model.save()      
      await this.notifier.log('browser:disconnected:response', this.model.toJSON())
    })

    if (shouldNotifyOnConnect) {
      await this.notifier.log('browser:connected:response', this.model.toJSON())
    }

    return this.browser
  }
  async connect() {
    if (this.browser) {
      return this.browser
    }

    return this.launch()
  }
  async reconnect() {
    try {
      return await puppeteer.connect({
        ...this.config(),
        browserWSEndpoint: this.model.attributes.get('ws_endpoint')
      })
    } catch (err) {
      this.notifier.log('browser:reconnect:error', err)
      return false
    }
  }
  async newPage() {
    let pages = await this.browser.pages()

    pages = pages.filter(v => v.url() === 'about:blank')

    if (pages.length > 1) {
      pages.map(async (v, i) => {
        if (i > 0) {
          await v.close()
        }
      })
    }

    let page = await this.browser.newPage()

    if (!this.lastPage) {
      // try {
      //   page.setRequestInterception(true)
      //   page.on('request', (request) => {
      //     if (request.resourceType() === 'image') {
      //       request.abort()
      //     } else {
      //       request.continue()
      //     }
      //   })
      // } catch (err) {
      //   this.notifier.log('browser:newPage:error', err)
      // }
      page = await this.stealthPage.onLoad(page)
    }

    return this.stealthPage.onCreate(page)
  }
  async page() {
    if (this.lastPage) {
      return this.lastPage
    } else {
      this.lastPage = await this.newPage()
    }

    return this.lastPage
  }
  async closeLastPages() {
    const pages = await this.browser.pages()

    console.log(pages)
  }
}

module.exports = Puppeteer
