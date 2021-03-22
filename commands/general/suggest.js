const Utils = require("../../modules/utils.js");
const Discord = require("discord.js");
const { config, lang, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
  name: 'suggest',
  run: async (bot, message, args) => {
    if (config.Suggestions.Type.toLowerCase() == 'both' && [message.channel.name, message.channel.id].includes(config.Suggestions.Channels.Suggestions)) return;
    let channel = Utils.findChannel(config.Suggestions.Channels.Suggestions, message.guild);

    if (!channel) return message.channel.send(Embed({ preset: 'console' }));
    if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

    channel.send(Utils.setupEmbed({
      configPath: embeds.Embeds.Suggestion,
      color: config.Suggestions.Colors.Pending,
      variables: [
        ...Utils.userVariables(message.member, "user"),
        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL() },
        { searchFor: /{suggestion}/g, replaceWith: args.join(" ") }
      ]
    })).then(async msg => {
      await msg.react(config.Suggestions.Emojis.Upvote);
      await msg.react(config.Suggestions.Emojis.Downvote);
    })
    message.channel.send(Embed({ title: lang.GeneralModule.Commands.Suggest.Embed.Title, description: lang.GeneralModule.Commands.Suggest.Embed.Description, color: config.EmbedColors.Success }));
  },
  description: "Suggest something for the Discord server",
  usage: 'suggest <idea>',
  aliases: []
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357