const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: 'unban',
    run: async (bot, message, args) => {
        if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, message.guild)) return message.channel.send(Embed({ preset: 'console' }));
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        const bans = await message.guild.fetchBans();

        [await Utils.variables.db.get.getPrefixes(message.guild.id), config.Prefix, `<@${bot.user.id}>`, `<@!${bot.user.id}>`].forEach(prefix => {
            message.content = message.content.replace(prefix, "")
        })

        let userTag = message.content.replace("unban", '').replace(/(@|<|>|!)/g, '').trim().split('#');
        let userID = message.content.replace("unban", '').replace(/(@|<|>|!)/g, '').trim();

        let user = bans.get(userID) || bans.find(ban => ban.user.username == userTag[0].replace("'", "\'") || (ban.user.username == userTag[0] && ban.user.discriminator == userTag[1]));

        if (user) {
            await message.guild.members.unban(user.user.id)
            message.channel.send(Utils.setupEmbed({
                configPath: {},
                title: lang.ModerationModule.Commands.Unban.Embeds.Unbanned.Title,
                description: lang.ModerationModule.Commands.Unban.Embeds.Unbanned.Description,
                color: config.EmbedColors.Success,
                variables: [
                    ...Utils.userVariables(message.member, "executor"),
                    { searchFor: /{user-id}/g, replaceWith: user.user.id },
                    { searchFor: /{user-username}/g, replaceWith: user.user.username },
                    { searchFor: /{user-tag}/g, replaceWith: user.user.tag },
                    { searchFor: /{user-mention}/g, replaceWith: '<@' + user.user.id + '>' },
                    { searchFor: /{user-pfp}/g, replaceWith: user.user.displayAvatarURL({ dynamic: true }) },
                ]
            }))

            bot.emit('userUnpunished', module.exports.name, user.user, message.member)
        } else message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Unban.Errors.UserNotBanned }));
    },
    description: "Unban a user on the Discord server",
    usage: 'unban <user ID/user tag>',
    aliases: []
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357