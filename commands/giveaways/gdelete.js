const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'gdelete',
    run: async (bot, message, args) => {
        const giveaway = args.length > 0 ? await Utils.variables.db.get.getGiveawayFromID(args[0]) || await Utils.variables.db.get.getGiveawayFromName(args[0]) : await Utils.variables.db.get.getLatestGiveaway();
        if (args.length > 0 && !giveaway) {
            return message.channel.send(Embed({ preset: 'error', description: lang.GiveawaySystem.Commands.Gdelete.Errors.InvalidGiveaway.replace(/{name}/g, args.join(" ")) }));
        } else if (!giveaway) {
            return message.channel.send(Embed({ preset: 'error', description: lang.GiveawaySystem.Commands.Gdelete.Errors.NoGiveaways }));
        } else {
            /*bot.guilds.cache.get(giveaway.guild)
                .channels.cache.get(giveaway.channel)
                .messages.fetch(giveaway.messageID)
                .then(msg => msg.delete()).catch(err => { });*/
            await Utils.variables.db.update.giveaways.deleteGiveaway(giveaway.messageID);
            message.channel.send(Embed({ title: lang.GiveawaySystem.Commands.Gdelete.Deleted }));
        }
    },
    description: "Delete the ongoing giveaway",
    usage: 'gdelete [giveaway name]',
    aliases: [
        'giveawaydelete',
        'deletegiveaway'
    ]
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357