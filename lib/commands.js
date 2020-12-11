const Puppeteer = require('./puppeteer')
const application = require('./application')
const notifier = require('./notifier')
const { delay } = require('./util')

async function commandBrowserStart({ browser }) {
  const app = await application()
  

  const model = await app.model.BrowserProfile


  const bot = new Puppeteer(app)
  await bot.connect()

  return bot
}

async function commandBrowserStop({ browser }) {
  const app = await application()

  const bot = new Puppeteer(app)
  browser = await bot.connect()
  await browser.close()
  await delay(2000)
  process.exit()
}

async function commandBrowserCheckStatus({ browser }) {
  const app = await application()

  const model = await app.model.BrowserProfile

  if (!model.attributes.get('ws_endpoint')) {
    return false
  }

  const bot = new Puppeteer(app)
  const isConnected = await bot.reconnect()

  return !!isConnected
}

async function commandBrowserData({ browser }) {
  const app = await application()

  const model = await app.model.BrowserProfile

  if (!model.attributes.get('ws_endpoint')) {
    return false
  }

  const bot = new Puppeteer(app)
  return await bot.reconnect()
}

async function commandCredentialAdd({ key, username, password }) {
  const app = await application()

  const model = await app.model.Credential

  await model.fill({ key, username, password }).save()

  await notifier.log('credential:add:log', { message: `Successfully added user (${username})` })
}

async function commandLoginShopee({ browser, credential }) {
  const app = await application()
  credential = await app.model.Credential.toJSON()

  try {
    browser = await commandBrowserStart({ browser })
  } catch (err) {
    console.error('Error while starting browser', err)
    process.exit()
  }

  let page

  try {
    page = await browser.page()
  } catch (err) {
    console.error('Error while creating page', err)
    process.exit()
  }

  try {
    await notifier.log('login:shopee:log', { message: 'Checking login status' })

    await page.goto('https://shopee.co.id', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })

    await delay(10000)

    const isLoggedIn = await page.$('.shopee-avatar')

    if (!!isLoggedIn) {
      console.log('Already login to shopee')
      await page.close()
      return 'Already logged in to shopee'
    }   
  } catch (err) {
    await page.close()
    throw err
  }

  try {
    await notifier.log('login:shopee:log', { message: 'Redirecting to seller shopee login page' })

    await page.goto('https://shopee.co.id/buyer/login?next=https%3A%2F%2Fshopee.co.id%2F', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
  } catch (err) {
    await page.close()
    throw err
  }

  // var [response] = await Promise.all([
  //   page.waitForNavigation({
  //     timeout: 60000,
  //     waitUntil: 'domcontentloaded'
  //   }),
  //   page.click('.header__component__label > a.pointer', {
  //     delay: 100
  //   }),
  // ])

  try {
    await page.waitForSelector('[name="loginKey"]')
  } catch (err) {
    await delay(5000)
    await page.close()
    return 'Already logged in to shopee'
  }

  await notifier.log('login:shopee:log', { message: 'Filling in credential form fields' })

  await page.type('[name="loginKey"]', credential.username, {
    delay: 90
  })
  await page.type('[name="password"]', credential.password, {
    delay: 50
  })

  await delay(2550)

  await notifier.log('login:shopee:log', { message: 'Pressing enter' })

  try {
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      delay(3000)
    ]);
  } catch (err) {}

  await notifier.log('login:shopee:log', { message: 'Checking if OTP needs to be filled' })

  await delay(900000000)
}


async function commandBuyShopee({ browser, credential, url }) {
  const app = await application()
  credential = await app.model.Credential.toJSON()

  try {
    browser = await commandBrowserStart({ browser })
  } catch (err) {
    console.error('Error while starting browser', err)
    process.exit()
  }

  let page

  try {
    page = await browser.page()
  } catch (err) {
    console.error('Error while creating page', err)
    process.exit()
  }

  try {
    await notifier.log('login:shopee:log', { message: 'Checking login status' })

    await page.goto('https://shopee.co.id', {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })

    await delay(10000)

    const isLoggedIn = await page.$('.shopee-avatar')

    if (!isLoggedIn) {
      console.log('You need to login to shopee run command "login:shopee"')
      await page.close()
      return 'You need to login to shopee run command "login:shopee"'
    }   
  } catch (err) {
    await page.close()
    throw err
  }

  try {
    await notifier.log('login:shopee:log', { message: 'Redirecting product page' })

    await page.goto(url, {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    })
  } catch (err) {
    await page.close()
    throw err
  }

  const runProcess = async () => {
    let result = await page.evaluate(() => {
      var icon = document.querySelector('.icon-add-to-cart')

      if (icon && icon.parentElement && icon.parentElement.nodeName && icon.parentElement.nodeName.toUpperCase() === 'BUTTON') {
        icon.parentElement.click()
        
        return true
      }

      return false
    })

    if (! result) {
      console.log('Add to cart button does not exists. Reloading ...')
      await delay(1000)
      await page.reload({
        waitUntil: 'domcontentloaded'
      })
    
      await delay(1000)
      return runProcess()
    }

    return true
  }

  await runProcess()

  await delay(900000000)
}


const commands = {
  commandBrowserStart,
  commandBrowserStop,
  commandBrowserCheckStatus,
  commandBrowserData,
  commandLoginShopee,
  commandCredentialAdd,
  commandBuyShopee
}

module.exports = commands