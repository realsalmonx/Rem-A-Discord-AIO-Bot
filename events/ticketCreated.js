const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, ticket, channel, reason) => {

    if (!config.Tickets.Logs.Enabled) return;

    let guild = bot.guilds.cache.get(ticket.guild);
    let creator = guild.member(ticket.creator)
    let logs = Utils.findChannel(config.Tickets.Logs.Channel, guild);

    if (!logs) return;

    logs.send(Utils.Embed({
        title: lang.TicketModule.Logs.Tickets.Created.Title,
        fields: [
            { name: lang.TicketModule.Logs.Tickets.Created.Fields[0], value: `${ticket.channel_name} \n <#${ticket.channel_id}>` },
            { name: lang.TicketModule.Logs.Tickets.Created.Fields[1], value: creator },
            { name: lang.TicketModule.Logs.Tickets.Created.Fields[2], value: reason ? reason : lang.TicketModule.Logs.Tickets.NoReason }
        ]
    }))
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357