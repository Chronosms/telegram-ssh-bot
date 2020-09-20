const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Session = require('telegraf/session')
const SSH = require('simple-ssh')

const SSH_HELP = `\`\`\`
ssh - manipulating with connection

Example:
ssh root@localhost [-p 22]\`\`\``

const CMD_HELP = `\`\`\`
cmd - executing commands in remote machine

Example:
cmd ls -lah\`\`\``

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(Session())

bot.start(ctx => {
    delete ctx.session.connectionString
    const name = ctx.update.message.from.first_name

    ctx.reply(`Hi, ${name}!`, Markup
        .keyboard([
            ['/help'],
            [`ssh ${process.env.USER}@localhost`]
        ])
        .oneTime()
        .extra())
})

bot.command('help', async ctx => {
    await ctx.replyWithMarkdown(SSH_HELP)
    await ctx.replyWithMarkdown(CMD_HELP)
})

bot.hears(/ssh ([\d\w.@]*) ?(-p ([\d]*))?/g, (ctx, next) => {
    if (ctx.session.connectionString) return next()
    const cred = ctx.match[1].split('@')
    const port = ctx.match[3] || 22
    ctx.session.connectionString = {
        host: cred[1],
        port,
        user: cred[0]
    }
    return ctx.reply(`Enter password for ${cred[0]}:`)
})

bot.hears(/(.*)/g, (ctx, next) => {
    if (ctx.session.ssh) return next()
    ctx.session.connectionString.pass = ctx.match[1]
    ctx.reply('Trying to connect')
    ctx.session.ssh = new SSH(ctx.session.connectionString)
    ctx.session.ssh.on('error', function(err) {
        ctx.reply('Oops, something went wrong.');
        delete ctx.session.ssh
        delete ctx.session.connectionString
        // console.log(err);
        ctx.session.ssh.end();
    })
    ctx.session.ssh.exec('echo Succeed', {
        out: function(stdout) {
            ctx.replyWithMarkdown(`Test echo: \`${stdout}\``)
            ctx.session.ssh.reset()
        }
    }).start()
})

bot.hears(/(.*)/g, (ctx, next) => {
    if (!ctx.session.ssh) return next()
    console.log(ctx.match[1])
    ctx.session.ssh.exec(ctx.match[1], {
        out: function (stdout) {
            console.log(stdout)
            ctx.replyWithHTML(`<code>${stdout}</code>`)
            ctx.session.ssh.reset()
        },
        err: function(stderr) {
            console.log(stderr); // this-does-not-exist: command not found
            ctx.replyWithHTML(`<code>${stderr.replace('zsh:1: ', '')}</code>`)
            ctx.session.ssh.reset()
        }
    }).start()
})

bot.launch()
