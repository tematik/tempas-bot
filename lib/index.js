const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '../', '.env')
})
const { program } = require('commander');
const pkg = require('../package')
const { delay } = require('./util')
const commands = require('./commands')
const Prompt = require('prompt-password')

program
  .command('browser:start')
  .requiredOption('-B, --browser <browser_profile_name>', 'Browser profile name', 'default')
  .description('Start a browser with stored profile name')
  .action(async ({ browser }) => {
    const bot = await commands.commandBrowserStart({ browser })

    if (bot._lastConnectionUseExisting == true) {
      await delay(500)
      console.log('Exiting command browser:start since its using existing connection')
      process.exit()
    }
  })

program
  .command('browser:stop')
  .requiredOption('-B, --browser <browser_profile_name>', 'Browser profile name', 'default')
  .description('Stop browser with given profile name from running')
  .action(async ({ browser }) => {
    commands.commandBrowserStop({ browser })
  })

program
  .command('credential:add')
  .requiredOption('-K, --key <key>', 'Credential key/ID as an identifier', 'default')
  .requiredOption('U, --username <username>', 'Username/phone/email')
  // .requiredOption('P, --password <password>', 'Password')
  .description('Add credential to login to shopee')
  .action(async ({ key, username }) => {
    const prompt = new Prompt({
      type: 'password',
      message: 'Enter your password',
      name: 'password'
    });
     
    const password = await prompt.run()

    await commands.commandCredentialAdd({ key, username, password })
    process.exit()
  })


program
  .command('browser:status')
  .requiredOption('-B, --browser <browser_profile_name>', 'Browser profile name', 'default')
  .description('Check browser connection status')
  .action(async ({ browser }) => {
    let isConnected = await commands.commandBrowserCheckStatus({ browser })
    await delay(300)
    console.log(!!isConnected)
    process.exit()
  })

program
  .command('login:shopee')
  .description('Login to buyer shopee')
  .requiredOption('-B, --browser <browser_profile_name>', 'Browser profile name', 'default')
  .requiredOption('-C, --credential <credential_key>', 'Credential key', 'default')
  .action(async function ({ browser, credential }) {
    try {
      await commands.commandLoginShopee({ browser, credential })
    } catch (err) {
      console.error(err)
      process.exit()
    }

    process.exit()
  })

program
  .command('buy:shopee')
  .description('Buy product from shopee')
  .requiredOption('-B, --browser <browser_profile_name>', 'Browser profile name', 'default')
  .requiredOption('-C, --credential <credential_key>', 'Credential key', 'default')
  .requiredOption('-U, --url <url>', 'URL to buy')
  .action(async function ({ browser, credential, url }) {
    try {
      await commands.commandBuyShopee({ browser, credential, url })
    } catch (err) {
      console.error(err)
      process.exit()
    }

    process.exit()
  })


program.version(pkg.version, '-v, --version', 'output the current version')
program.parse(process.argv)