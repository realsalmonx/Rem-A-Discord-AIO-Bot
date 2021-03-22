const Utils = require('../modules/utils');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

module.exports = async (bot, oldChannel, newChannel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!newChannel.guild || !config.Logs.Enabled.includes("ChannelUpdated")) return;
        if (config.Logs.ChannelUpdateBlacklist.some(name => oldChannel.name.toLowerCase().startsWith(name.toLowerCase()) || newChannel.name.toLowerCase().startsWith(name.toLowerCase()))) return;

        const ignore = ["channels:", "bots:", "humans:", "total members:", "status:", "online:", "ip:"]
        const logs = Utils.findChannel(config.Logs.Channels.ChannelUpdated, newChannel.guild);

        let Tickets = await Utils.getOpenTickets(newChannel.guild);
        let Applications = await Utils.getOpenApplications(newChannel.guild);
        let IDs = [...Tickets.map(channel => channel.id), ...Applications.map(channel => channel.id)];

        if (IDs.includes(newChannel.id) || ignore.some(name => oldChannel.name.toLowerCase().startsWith(name.toLowerCase()) || !logs)) return;

        if (oldChannel.name !== newChannel.name) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.NameUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[0],
                        value: (newChannel.type === 'text') ? `<#${newChannel.id}>` : newChannel.id
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[1],
                        value: oldChannel.name
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[2],
                        value: newChannel.name
                    }
                ],
                timestamp: Date.now()
            }))
        }

        if (JSON.stringify(oldChannel.permissionOverwrites) !== JSON.stringify(newChannel.permissionOverwrites)) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.PermsUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[0],
                        value: (newChannel.type === 'text') ? `<#${newChannel.id}>` : newChannel.name
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[1].Name,
                        value: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[1].Value
                    }
                ],
                timestamp: Date.now()
            }))
        }

        if (oldChannel.parentID !== newChannel.parentID) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.ParentUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[0],
                        value: `<#${newChannel.id}>`
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[1],
                        value: (oldChannel.parent) ? oldChannel.parent.name : lang.LogSystem.ChannelUpdated.ParentUpdated.None
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[2],
                        value: (newChannel.parent) ? newChannel.parent.name : lang.LogSystem.ChannelUpdated.ParentUpdated.None
                    }
                ],
                timestamp: Date.now()
            }))
        }

        if (oldChannel.topic !== newChannel.topic) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.TopicUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[0],
                        value: `<#${newChannel.id}>`
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[1],
                        value: (oldChannel.topic) ? oldChannel.topic : lang.LogSystem.ChannelUpdated.TopicUpdated.None
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[2],
                        value: newChannel.topic ? newChannel.topic : lang.LogSystem.ChannelUpdated.TopicUpdated.None
                    }
                ],
                timestamp: Date.now()
            }))
        }
    }
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357