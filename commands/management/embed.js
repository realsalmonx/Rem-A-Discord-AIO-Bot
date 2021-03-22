const Utils = require("../../modules/utils");

module.exports = {
    name: "embed",
    run: async (bot, message, args) => {
        if (!args.length) return message.channel.send(Utils.Embed({ preset: "invalidargs", usage: "embed <embed name>" }));

        let embed = Utils.variables.embeds.Embeds[args.join(" ")];

        if (!embed) return message.channel.send(Utils.Embed({ preset: "error", description: "An embed with the name `" + args.join(" ") + "` could not be found in the embeds.yml" }));

        let setupEmbed = Utils.setupEmbed({
            configPath: Array.isArray(embed) ? embed[0] : embed,
            variables: [
                ...Utils.userVariables(message.member, "user"),
                ...Utils.userVariables(message.member, "executor"),
                { searchFor: /{server-name}/g, replaceWith: message.guild.name },
                { searchFor: /{prefix}/g, replaceWith: await Utils.variables.db.get.getPrefixes(message.guild.id) },
                { searchFor: /{total}/g, replaceWith: message.guild.memberCount },
            ]
        });

        // Clear images because they will cause an error
        if (setupEmbed.image && setupEmbed.image.iconURL && !setupEmbed.image.url.startsWith("http")) setupEmbed.setImage();
        if (setupEmbed.author && setupEmbed.author.iconURL && !setupEmbed.author.iconURL.startsWith("http")) setupEmbed.setAuthor(setupEmbed.author ? setupEmbed.author.name : "")
        if (setupEmbed.footer && setupEmbed.footer.iconURL && !setupEmbed.footer.iconURL.startsWith("http")) setupEmbed.setFooter(setupEmbed.footer ? setupEmbed.footer.text : "");
        if (setupEmbed.thumbnail && setupEmbed.thumbnail.url && !setupEmbed.thumbnail.url.startsWith("http")) setupEmbed.setThumbnail();

        message.channel.send("**Some variables may not work**", setupEmbed);
    },
    usage: "embed <embed name>",
    description: "Test out an embed from the embeds.yml",
    aliases: []
}; 
// 2271 505 39612 4.4.4 ZDRhMGQ4ZTUyMjk1ZTU2 1 0 1616381357