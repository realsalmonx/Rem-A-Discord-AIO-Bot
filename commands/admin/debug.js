const Utils = require("../../modules/utils.js");
const { Embed } = Utils;
const { config, lang } = Utils.variables;

module.exports = {
    name: "debug",
    run: async (bot, message, args) => {
        const msg = await message.channel.send(Embed({ title: ':tools: Creating Debug Report', description: 'Your debug report is being generated' }));
        require('../../modules/methods/generateDebug')(bot)
            .then(url => {
                msg.edit(Embed({
                    title: ':white_check_mark: Debug Report Created', description: 'Please send this URL to the Corebot Support Team:\n' + url
                }))
            })
    },
    description: "Create a Corebot Debug Report",
    usage: "debug",
    aliases: []
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357