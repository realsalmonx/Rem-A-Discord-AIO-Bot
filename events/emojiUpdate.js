const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, oldEmoji, newEmoji) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!Utils.variables.config.Logs.Enabled.includes("EmojiUpdated")) return;
        
        const logs = Utils.findChannel(Utils.variables.config.Logs.Channels.EmojiUpdated, newEmoji.guild);
        
        logs.send(Utils.Embed({
            title: lang.LogSystem.EmojiUpdated.Title,
            fields: [
                {
                    name: lang.LogSystem.EmojiUpdated.Fields[0],
                    value: oldEmoji.name
                }, {
                    name: lang.LogSystem.EmojiUpdated.Fields[1],
                    value: newEmoji.name
                }, {
                    name: lang.LogSystem.EmojiUpdated.Fields[2],
                    value: `<:${newEmoji.name}:${newEmoji.id}>`
                }
            ],
            timestamp: Date.now()
        }))
    }
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357