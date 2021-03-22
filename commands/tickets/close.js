const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const closeTicket = require('../../modules/methods/closeTicket');


module.exports = {
    name: 'close',
    run: async (bot, message, args) => {
        closeTicket(bot, args, message.member, message.channel);
    },
    description: "Close the ticket you are typing in",
    usage: 'close [reason]',
    aliases: [
        'ticketclose',
        'closeticket'
    ]
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357