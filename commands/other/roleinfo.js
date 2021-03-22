const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'roleinfo',
    run: async (bot, message, args) => {
        const role = message.mentions.roles.first() || Utils.findRole(args.join(" "), message.guild, false);

        if (!role) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        const members = role.members
            .array()
            .slice(0, 12)
            .map((member, i) => {
                if (i == 11) return '...'
                return ' <@' + member.user.id + '>'
            });

        message.channel.send(Embed({
            color: role.hexColor,
            title: lang.Other.OtherCommands.Roleinfo.Title,
            description: `<@&${role.id}>`,
            fields: [
                { name: lang.Other.OtherCommands.Roleinfo.Fields[0], value: role.createdAt.toLocaleString(), inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: lang.Other.OtherCommands.Roleinfo.Fields[1], value: role.position, inline: true },
                { name: lang.Other.OtherCommands.Roleinfo.Fields[2], value: role.permissions.toArray().map(perm => perm.toLowerCase().replace(/_/g, ' ')).join(", ") || lang.Other.OtherCommands.Roleinfo.NoPerms, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: lang.Other.OtherCommands.Roleinfo.Fields[3].replace(/{amt}/g, role.members.size ? role.members.size : 0), value: members && members.length ? members.join("") : lang.Other.OtherCommands.Roleinfo.NoMembers, inline: true }
            ],
            footer: { text: lang.Other.OtherCommands.Roleinfo.Footer.replace(/{id}/g, role.id), icon: bot.user.displayAvatarURL({ dynamic: true }) }
        }));
    },
    description: "View information on a role",
    usage: 'roleinfo <@role>',
    aliases: []
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357