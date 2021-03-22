const Utils = require('../utils');
const { paste } = Utils;
const chalk = require('chalk');

module.exports = (bot) => {
    (async () => {
        const warnings = await require('./getWarnings')(bot);
        let index = 0;

        if (index == bot.guilds.cache.size - 1) {
            if (warnings.length > 0) {
                paste(`Created At: ${new Date().toLocaleString()}\nBot Info:\n  Tag => ${bot.user.tag}\n  ID => ${bot.user.id}\n  Guilds => ${bot.guilds.cache.size}\n  Users => ${bot.users.cache.size}\n\nWarnings:\n${warnings.map(warning => '- ' + warning).join('\n')}`)
                    .then(res => {
                        console.log(Utils.warningPrefix + "One or more errors have automatically been detected, you can view them here: " + chalk.red(res));
                    })
                    .catch(err => {
                        console.log(Utils.errorPrefix + 'An error occured while creating the startup report.');
                        require('../error')(err.message, err.stack, "generateReport.js:18", false);
                    })
            }
        }
        index++;
    })();
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357