const { Embed } = require("../../modules/utils");
const AddonHandler = require("../../modules/handlers/AddonHandler");
const Utils = require("../../modules/utils");
const { capitalize } = require("lodash");

module.exports = {
    name: "addon",
    run: async (bot, message, args) => {
        if (args.length == 0) return message.channel.send(Embed({ preset: "invalidargs", usage: module.exports.usage }));

        if (args[0].toLowerCase() == "list") {
            let loaded = AddonHandler.addons.filter(a => a.loaded).map(a => a.name)
            let unloaded = AddonHandler.addons.filter(a => !a.loaded).map(a => a.name)
            return message.channel.send(Embed({
                title: "Addons",
                description: `The following addons are currently installed`,
                fields: [
                    { name: "Loaded", value: loaded.length ? loaded.join("\n") : "None", inline: true },
                    { name: "Unloaded", value: unloaded.length ? unloaded.join("\n") : "None", inline: true }
                ],
                timestamp: new Date()
            }))
        }

        if (args.length < 2) return message.channel.send(Embed({ preset: "invalidargs", usage: module.exports.usage }));

        const action = args[0].toLowerCase();
        const name = args[1].replace(/\.js/, "");

        if (action == "unload") {
            AddonHandler.unload(name)
                .then(() => {
                    Utils.variables.db.update.addons.setUnloaded(name)
                    message.channel.send(Embed({
                        title: "Addon Unloaded",
                        description: "The `" + name + "` addon has been unloaded."
                    }));
                })
                .catch(e => {
                    if (e == "That addon does not exist") return message.channel.send(Embed({ preset: "error", description: "That addon does not exist" }));
                    else if (e == "That addon is already unloaded") return message.channel.send(Embed({ preset: "error", description: "That addon is already unloaded" }));
                    else {
                        message.channel.send(Embed({ preset: "console" }));
                        throw e
                    }
                })
        } else if (action == "load") {
            AddonHandler.load(name)
                .then(() => {

                    Utils.variables.db.update.addons.setLoaded(name)

                    message.channel.send(Embed({
                        title: "Addon Loaded",
                        description: "The `" + name + "` addon has been loaded."
                    }));
                })
                .catch(e => {
                    if (e == "That addon does not exist") return message.channel.send(Embed({ preset: "error", description: "That addon does not exist" }))
                    else if (e == "That addon is already loaded") return message.channel.send(Embed({ preset: "error", description: "That addon is already loaded" }))
                    else if (e == "An error occurred while loading the addon") return message.channel.send(Embed({ preset: "errror", description: "An error occurred while loading the addon. Please check console for further details." }))
                    else {
                        message.channel.send(Embed({ preset: "console" }));
                        throw e
                    }
                })
        } else if (action == "reload") {
            AddonHandler.unload(name)
                .then(() => {
                    AddonHandler.load(name)
                        .then(() => {

                            Utils.variables.db.update.addons.setLoaded(name)

                            message.channel.send(Embed({
                                title: "Addon Reloaded",
                                description: "The `" + name + "` addon has been reloaded."
                            }));
                        })
                        .catch(e => {
                            if (e == "That addon does not exist") return message.channel.send(Embed({ preset: "error", description: "That addon does not exist" }))
                            else if (e == "That addon is already loaded") return message.channel.send(Embed({ preset: "error", description: "That addon is already loaded" }))
                            else if (e == "An error occurred while loading the addon") return message.channel.send(Embed({ preset: "error", description: "An error occurred while loading the addon. Please check console for further details." }))
                            else {
                                message.channel.send(Embed({ preset: "console" }));
                                throw e
                            }
                        })
                })
                .catch(e => {
                    if (e == "That addon does not exist") return message.channel.send(Embed({ preset: "error", description: "That addon does not exist" }));
                    else if (e == "That addon is already unloaded") return message.channel.send(Embed({ preset: "error", description: "That addon is already unloaded" }))
                    else {
                        message.channel.send(Embed({ preset: "console" }));
                        throw e
                    }
                })
        } else if (action == "info") {
            const addon = AddonHandler.addons.find(addon => addon.name.toLowerCase() == name.toLowerCase());

            if (!addon) return message.channel.send(Embed({ preset: "error", description: "That addon does not exist" }));

            const addon_errors = Utils.variables.addon_errors ? Utils.variables.addon_errors.filter(error => error.addon.toLowerCase() == addon.name.toLowerCase()) : [];

            message.channel.send(Embed({
                title: "➕ " + capitalize(addon.name) + " Addon",
                fields: [
                    {
                        name: "Status",
                        value: "**" + (addon.loaded ? ":white_check_mark: Loaded" : ":x: Unloaded") + "**"
                    },
                    {
                        name: "Events",
                        value: addon.events.length > 0 ? addon.events.map(event => "> **" + event.name + "**").join("\n") : "None"
                    },
                    {
                        name: "Commands",
                        value: addon.commands.length > 0 ? addon.commands.map(command => "> **" + command.command + "**" + (command.aliases.length > 0 ? ` (${command.aliases.join(', ')})` : '')).join('\n') : "None"
                    },
                    {
                        name: "Errors",
                        value: `> **Total:** ${addon_errors.length}\n> **Unique:** ${(addon_errors.length > 0 ? [...new Set(addon_errors.map(error => error.error))] : []).length}`
                    }
                ]
            }))
        } else return message.channel.send(Embed({ preset: "invalidargs", usage: module.exports.usage }));
    },
    description: "Manage your addons",
    aliases: [],
    usage: "addon <unload/load/reload/info/list> <file name>"
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357