const Utils = require('../utils.js');
const fs = require('fs');
const chalk = require('chalk');

module.exports = {
    addons: [],
    unload(addon_name) {
        return new Promise((resolve, reject) => {
            const addon = module.exports.addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase());

            if (!addon) return reject("That addon does not exist");
            if (!addon.loaded) return reject("That addon is already unloaded");

            const CommandHandler = require('./CommandHandler');
            const EventHandler = require('./EventHandler');

            module.exports.addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase()).loaded = false;

            CommandHandler.commands.filter(command => command.addonName ? command.addonName.toLowerCase() == addon.name.toLowerCase() : false).forEach(c => c.enabled = false);
            EventHandler.events.filter(event => event.addonName ? event.addonName.toLowerCase() == addon.name.toLowerCase() : false).forEach(event => {
                Utils.variables.bot.removeListener(event.name, event.call)
            });

            delete require.cache[require.resolve('../../addons/' + addon.name)];

            resolve();
        })
    },
    load(addon_name) {
        return new Promise(async (resolve, reject) => {
            const addon = module.exports.addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase());

            if (!addon) return reject("That addon does not exist");
            if (addon.loaded) return reject("That addon is already loaded");

            const CommandHandler = require('./CommandHandler');
            const EventHandler = require('./EventHandler');

            try {
                let run = require('../../addons/' + addon.name);

                if (typeof run == "object" && run.run)
                    run = run.run;

                addon.run = run;
                CommandHandler.commands = CommandHandler.commands.filter(command => command.addonName ? command.addonName.toLowerCase() !== addon.name.toLowerCase() : true)

                await addon.run();

                const localAddon = module.exports.addons.find(a => a.name.toLowerCase() == addon_name.toLowerCase());
                if (localAddon) {
                    localAddon.commands = CommandHandler.commands.filter(command => command.addonName ? command.addonName.toLowerCase() == addon.name.toLowerCase() : false);
                    localAddon.events = EventHandler.events.filter(event => event.addonName ? event.addonName.toLowerCase() == addon.name.toLowerCase() : false);
                    localAddon.loaded = true;
                }

                resolve();
            } catch (e) {
                require("../error")(e.message, e.stack);
                console.log(Utils.errorPrefix + `An error occurred while loading the ${chalk.bold(addon.name)} addon. ${chalk.bold("Please contact the addon developer")}`);

                reject("An error occurred while loading the addon");
            }
        })
    },
    async set(addon) {
        if (!addon.name) return console.log(Utils.errorPrefix + "No addon name was supplied to AddonHandler#set");
        if (!addon.run) return console.log(Utils.errorPrefix + "No addon function was supplied to AddonHandler#set");

        let unloadedAddons = await Utils.variables.db.get.getUnloadedAddons()
        let loaded = !unloadedAddons.map(addon => addon.addon_name).includes(addon.name)

        if (loaded) {
            try {
                addon.run(module.exports.bot);
            } catch (err) {
                console.log(Utils.errorPrefix + `An error occurred while loading the ${chalk.bold(addon.name)} addon. ${chalk.bold("Please contact the addon developer")}`);

                require('../error')(err, `Error while running the ${addon.name} addon`, addon.name + " addon");
            }
        }

        const CommandHandler = require('./CommandHandler');
        const EventHandler = require('./EventHandler');

        module.exports.addons.push({
            name: addon.name,
            run: addon.run,
            commands: CommandHandler.commands.filter(command => command.addonName ? command.addonName.toLowerCase() == addon.name.toLowerCase() : false),
            events: EventHandler.events.filter(event => event.addonName ? event.addonName.toLowerCase() == addon.name.toLowerCase() : false),
            loaded
        })

        if (loaded) console.log(Utils.infoPrefix + addon.name + " addon loaded.");
    },
    init: async bot => {
        module.exports.bot = bot;

        fs.readdir('./addons', async (err, files) => {
            if (err) {
                if (err.message.startsWith("ENOENT: no such file or directory, scandir")) {
                    files = [];
                    fs.mkdirSync("./addons");
                }
                else throw err;
            }

            files
                .filter(f => f.endsWith(".js"))
                .forEach(addon => {
                    try {
                        let run = require('../../addons/' + addon);
                        if (typeof run == "object" && run.run)
                            run = run.run;

                        module.exports.set({
                            name: addon.replace(/\.js/, ""),
                            run
                        })
                    } catch (e) {
                        console.log(Utils.errorPrefix + `An error occurred while loading the ${chalk.bold(addon)} addon. ${chalk.bold("Please contact the addon developer")}`);

                        require("../error")(e.message, e.stack);
                    }
                })
            return module.exports;
        })
    }
}
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357