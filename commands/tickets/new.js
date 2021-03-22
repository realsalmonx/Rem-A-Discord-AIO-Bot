const Utils = require("../../modules/utils");
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const createTicket = require('../../modules/methods/createTicket');

module.exports = {
    name: 'new',
    run: async (bot, message, args) => {
        createTicket(bot, args, message.member, message.channel);
    },
    description: "Create a ticket",
    usage: config.Tickets.RequireReason ? 'new <reason>' : 'new [reason]',
    aliases: [
        'ticket'
    ]
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357