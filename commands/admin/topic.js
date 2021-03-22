const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: 'topic',
    run: async (bot, message, args) => {
        let newTopic;
        let channel = message.mentions.channels.first() || message.channel;

        if (message.mentions.channels.first()) {
            if (!args[1]) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
            else newTopic = args.slice(1).join(" ");
        } else {
            if (!args[0]) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
            else newTopic = args.join(" ");
        }

        channel.setTopic(newTopic)
        message.channel.send(Embed({ title: lang.AdminModule.Commands.Topic.Title, description: lang.AdminModule.Commands.Topic.Description.replace(/{newtopic}/g, newTopic), color: config.EmbedColors.Success }));
    },
    description: "Change the topic of a channel",
    usage: 'topic [#channel] (new topic)',
    aliases: ['settopic']
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357