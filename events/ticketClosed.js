const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, ticket, executor, reason) => {

    if (!config.Tickets.Logs.Enabled) return;

    let guild = bot.guilds.cache.get(ticket.guild);
    let creator = guild.member(ticket.creator);
    let logs = Utils.findChannel(config.Tickets.Logs.Channel, guild);
    let addedUsers = await Utils.variables.db.get.getAddedUsers(ticket.channel_id);

    if (!logs) return;

    logs.send(Utils.Embed({
        title: lang.TicketModule.Logs.Tickets.Closed.Title,
        fields: [
            { name: lang.TicketModule.Logs.Tickets.Closed.Fields[0], value: ticket.channel_name },
            { name: lang.TicketModule.Logs.Tickets.Closed.Fields[1], value: creator },
            { name: lang.TicketModule.Logs.Tickets.Closed.Fields[2], value: executor },
            { name: lang.TicketModule.Logs.Tickets.Closed.Fields[3], value: addedUsers.map(u => `<@${u.user}>`).join(', ') || lang.TicketModule.Commands.Close.NoAddedUsers },
            { name: lang.TicketModule.Logs.Tickets.Closed.Fields[4], value: reason ? reason : lang.TicketModule.Logs.Tickets.NoReason }
        ],
    }));
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357