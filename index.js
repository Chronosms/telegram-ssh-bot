const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Session = require('telegraf/session')
const SSH = require('simple-ssh')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(Session())

bot.start(ctx => ctx.reply('Hello world'))

bot.launch()
