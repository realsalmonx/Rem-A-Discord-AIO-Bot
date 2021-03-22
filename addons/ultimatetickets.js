const Utils = require('../modules/utils');

const { Embed } = Utils;
const db = require('better-sqlite3')('ultimatetickets.sqlite');

const ms = require('ms');

const bot_config = Utils.variables.config;
const bot_embeds = Utils.variables.embeds;

const request = require('request-promise');

const closeTicket = require('../modules/methods/closeTicket');
const createTicket = require('../modules/methods/createTicket');
const chalk = require('chalk');

module.exports = async (bot) => {
    const infoPrefix = Utils.infoPrefix + chalk.yellow(chalk.bold('[ULTIMATE TICKETS ADDON]'));

    db.prepare("CREATE TABLE IF NOT EXISTS reactionEmbeds(message VARCHAR(18) NOT NULL, category TEXT NULL)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS responseTimes(response TEXT, time TEXT, ticket VARCHAR(18))").run();
    db.prepare("CREATE TABLE IF NOT EXISTS notified(ticket VARCHAR(18), notifiedAt TEXT)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS autoclose_cancelled(ticket TEXT)").run();
    db.prepare("CREATE TABLE IF NOT EXISTS tickets(id TEXT, category TEXT)").run();

    const CustomConfig = require('../modules/CustomConfig.js');
    const config = new CustomConfig('./addon_configs/ultimatetickets.yml', {
        Permission: "Admin",
        "~": "The main permission for the ultimatetickets command",
        Categories: {
            Enabled: true,
            Disable_Speaking_Until_Category_Chosen: true,
            Ping_Role: true,
            Message: "Thank you for contacting us. Our {category} Team will be with you as soon as possible.",
            Reminder: {
                Enabled: true,
                Notify_After: 1
            },
            Commissions: {
                Enabled: true,
                Channel: "commissions",
                Emoji: "✅"
            },
            Categories: [
                {
                    Role: "Support",
                    Title: "Support",
                    Discord_Category: "Support",
                    Emoji: {
                        "Text": ":man_raising_hand:",
                        "Unicode": "🙋‍♂️"
                    },
                    Questions: [
                        "How may we help you?"
                    ]
                },
                {
                    Role: "Management",
                    Title: "Management",
                    Discord_Category: "Management",
                    Emoji: {
                        "Text": ":warning:",
                        "Unicode": "⚠️"
                    },
                    Questions: [
                        "How may our management team assist you?"
                    ]
                }
            ]
        },
        Waiting_Responded: {
            Enabled: true,
            Waiting: 'Tickets',
            '~': 'Waiting will usually be the category that tickets are created in',
            Responded: 'Responded',
            '~': 'Set responded to null if you have categories enabled',
            SupportRole: 'Support'
        },
        Tags: {
            Enabled: true,
            Prefix: '$',
            Tags: [
                {
                    "Title": "Test Tag",
                    "Description": "This is an example of a tag for Ultimate Tickets. You can test this tag by typing $test",
                    "Command": "test"
                }
            ]
        },
        Transcripts: {
            '~': 'Please note: These are transcripts that are hosted in the cloud',
            Enabled: true,
            Domain: "https://ultimatetickets.corebot.dev",
            Channel: "transcripts",
            DM_To_Creator: true,
            DM_To_Participants: true
        },
        Response_Times: {
            Enabled: true,
            Command: "response",
            SupportRole: "Support"
        },
        AutoClose: {
            Enabled: true,
            Notify: "24h",
            Close: "48h",
            Message: "{user} **WARNING** This ticket will be closed in 24 hours."
        },
        ReactToOpenTicket: {
            Emoji: "✏️"
        },
        Up_Down: {
            Enabled: true,
            Permission: "Staff",
            Up_Command: "up",
            Down_Command: "down"
        },
        Move: {
            Enabled: true,
            Command: "move",
            Permission: "Staff"
        },
        Close_Ticket_On_Leave: true,
        Pings: {
            User: true,
            Category_Role: true,
            Delete_After: 1
        },
        AutoClose_Cancel: {
            Command: "cancelclose",
            Permission: "Staff"
        }
    });

    const lang = new CustomConfig("./addon_configs/ultimatetickets_lang.yml", {
        Transcripts: {
            Created: "A cloud-based transcript has been created for {channel}\n\n{domain}/transcript/{transcript_id}",
            Sent_To_Creator: ":white_check_mark: **Sent to creator**",
            Unable_To_Send_To_Creator: ":x: **Not sent to creator**"
        },
        React_To_Open_Ticket: {
            Title: "Create a ticket",
            Category_Description: "React with :pencil2: to create a ticket for the {category} category",
            Normal_Description: "React with :pencil2: to create a ticket"
        },
        Tickets: {
            Answers: {
                Attachments: "**Attachments**\n{attachments}"
            }
        },
        Response_Time: {
            Title: "Response Time",
            Description: "Our average ticket response time is **{response_time}**."
        },
        AutoClose: {
            Title: "Closing",
            Description: "{user}, this ticket will be closed in 24 hours."
        },
        Up_Down: {
            Moved_Up: {
                Title: "Ticket Moved Up",
                Description: "This ticket has been moved from the **{old}** category to the **{new}** category."
            },
            Moved_Down: {
                Title: "Ticket Moved Down",
                Description: "This ticket has been moved from the **{old}** category to the **{new}** category."
            }
        },
        Move: {
            Moved: {
                Title: "Ticket Moved",
                Description: "This ticket has been moved from the **{old}** category to the **{new}** category."
            }
        },
        Choose_Category_Reminder: {
            Title: "Choose a category",
            Description: "{user}, please choose a category!"
        },
        Commissions: {
            Listing: {
                Title: "New Commission",
                Description: "React with ✅ to claim this commission."
            },
            Claimed: {
                Ticket: {
                    Title: "Commission Claimed",
                    Description: "Your freelancer is {user}"
                }
            }
        }
    })
    const CommandHandler = require('../modules/handlers/CommandHandler');
    const EventHandler = require('../modules/handlers/EventHandler');

    /*
        CATEGORIES
    */
    if (config.Categories.Enabled) {
        EventHandler.set('channelCreate', async (bot, channel) => {
            if (channel.type === 'dm') return;

            const ticketsCategory = Utils.findChannel(bot_config.Tickets.Channel.Category, channel.guild, 'category') || { id: 0 };

            setTimeout(async () => {
                const ticket = await Utils.variables.db.get.getTickets(channel.id);

                if ((ticket || /ticket-\d{4}/.test(channel.name)) && channel.parentID == ticketsCategory.id) {
                    if (ticket) {
                        db.prepare("INSERT INTO tickets VALUES(?, ?)").run(channel.id, null);
                        const creator = channel.guild.member(ticket.creator);

                        if (config.Categories.Disable_Speaking_Until_Category_Chosen) {
                            await channel.updateOverwrite(ticket.creator, {
                                'SEND_MESSAGES': false,
                                'VIEW_CHANNEL': true,
                                'READ_MESSAGE_HISTORY': true
                            });
                        }

                        const messages = await channel.messages.fetch();
                        const message = messages.find(m => m.embeds.length == 1 && m.author.id == bot.user.id);

                        const categories = config.Categories.Categories;

                        const updatedEmbed = Utils.setupEmbed({
                            configPath: bot_embeds.Embeds.Ticket,
                            variables: [
                                ...Utils.userVariables(creator, "user"),
                                { searchFor: /{reason}/g, replaceWith: "None" },
                                { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                            ]
                        });

                        delete updatedEmbed.thumbnail.url;

                        updatedEmbed.description += "\n\n" + categories.map(category => '**' + category.Emoji.Text + ' ' + category.Title + '**').join('\n') + "\n:x: **Close Ticket**";

                        message.edit(updatedEmbed);

                        [...categories.map(c => c.Emoji.Unicode), "❌"]
                            .forEach(async (emoji, i) => {
                                setTimeout(async () => {
                                    await message.react(emoji);
                                }, i * 500);
                            })
                    }
                }
            }, 1500 + bot.ws.ping);
        })
    }

    if (config.Transcripts.Enabled) {
        EventHandler.set('channelDelete', async (bot, channel) => {
            if (channel.type === 'dm') return;

            if (/ticket-\d{4}/.test(channel.name)) {
                const ticket = await Utils.variables.db.get.getTickets(channel.id);
                if (!ticket) return console.error('[ULTIMATE TICKETS] Could not find ticket in the database for ' + channel.name);

                const member = channel.guild.member(ticket.creator);

                const regexs = {
                    role: /<@&\d{18}>/g,
                    user: /<@\d{18}>/g,
                    channel: /<#\d{18}>/g
                }

                const replace = (text) => {
                    return text
                        .replace(regexs.role, roleText => {
                            const roleFound = channel.guild.roles.cache.get(roleText.match(/\d+/) ? roleText.match(/\d+/)[0] : '');
                            return roleFound ? "@" + roleFound.name : roleText;
                        })
                        .replace(regexs.user, userText => {
                            const userFound = channel.guild.member(userText.match(/\d+/) ? userText.match(/\d+/)[0] : '');
                            return userFound ? "@" + userFound.user.tag : userText;
                        })
                        .replace(regexs.channel, channelText => {
                            const channelFound = channel.guild.channels.cache.get(channelText.match(/\d+/) ? channelText.match(/\d+/)[0] : '');
                            return channelFound ? "#" + channelFound.name : channelText;
                        })
                }

                const messages = await Utils.variables.db.get.ticket_messages.getMessages(channel.id);

                await Promise.all(
                    messages.map(async (message, i) => {
                        return new Promise(async (resolve, reject) => {
                            messages[i].embed_fields = await Utils.variables.db.get.ticket_messages.getEmbedFields(message.message);
                            messages[i].content = replace(message.content);
                            if (message.embed_description)
                                messages[i].embed_description = replace(message.embed_description);
                            resolve();
                        })
                    })
                )

                const updatedMessages = messages.map(message => {
                    const includesEmbed = !!(message.embed_title || message.embed_description);

                    const author = {
                        id: message.author,
                        avatar: message.authorAvatar,
                        tag: message.authorTag
                    }
                    const createdAt = new Date(message.created_at);
                    const { content, attachment } = message;
                    if (includesEmbed && attachment) {
                        return {
                            embed: {
                                title: message.embed_title,
                                description: message.embed_description,
                                fields: message.embed_fields,
                                color: message.embed_color
                            },
                            attachment,
                            content,
                            author,
                            createdAt
                        }
                    } else if (includesEmbed) {
                        return {
                            embed: {
                                title: message.embed_title,
                                description: message.embed_description,
                                fields: message.embed_fields,
                                color: message.embed_color
                            },
                            content,
                            author,
                            createdAt
                        }
                    } else if (attachment) {
                        return {
                            attachment,
                            content,
                            author,
                            createdAt
                        }
                    } else {
                        return {
                            content,
                            author,
                            createdAt
                        }
                    }
                })

                request.post({
                    uri: "https://ultimatetickets.corebot.dev/api/v1/create_transcript",
                    headers: {
                        "Authorization": bot_config.Key
                    },
                    body: {
                        guild: {
                            id: ticket.guild,
                            name: channel.guild.name,
                            icon: channel.guild.iconURL({ dynamic: true })
                        },
                        channel: {
                            id: ticket.channel_id,
                            name: ticket.channel_name
                        },
                        creator: {
                            id: ticket.creator,
                            tag: member ? member.user.tag : "Unknown"
                        },
                        messages: updatedMessages
                    },
                    json: true
                })
                    .then(res => {
                        if (!res.transcript) {
                            console.error('[ULTIMATE TICKETS] No transcript key was sent in the response. Please contact ThisLightMan#6616.');
                        } else {
                            const embed = Embed({
                                title: "Transcript Created",
                                description: lang.Transcripts.Created
                                    .replace(/{channel}/g, ticket.channel_name)
                                    .replace(/{domain}/g, config.Transcripts.Domain)
                                    .replace(/{transcript_id}/g, res.transcript)
                            })

                            const Sent_To_User = false;
                            if (config.Transcripts.DM_To_Creator && member) {
                                member.send(embed)
                                    .then(() => {
                                        Sent_To_User = true;
                                    })
                                    .catch(() => {

                                    })
                            }
                            if (config.Transcripts.DM_To_Participants) {
                                const participants = [... new Set(
                                    updatedMessages
                                        .filter(msg => msg.author.id !== ticket.creator && msg.author.id !== bot.user.id)
                                        .map(msg => msg.author.id)
                                )]
                                participants.forEach(participant => {
                                    const user = channel.guild.member(participant);
                                    if (user) {
                                        user.send(embed)
                                            .catch(() => {

                                            })
                                    }
                                })
                            }

                            const logs = Utils.findChannel(config.Transcripts.Channel, channel.guild);
                            if (logs) {
                                if (config.Transcripts.DM_To_Creator)
                                    embed.description = embed.description + "\n\n" + Sent_To_User ? lang.Sent_To_Creator : lang.Transcripts.Unable_To_Send_To_Creator
                                logs.send(embed);
                            }
                        }
                    })
                    .catch(console.error)
            }
        })
    }

    EventHandler.set('message', async (bot, message) => {
        if (message.channel.type === 'dm') return;
        if (message.author.bot) return;

        /* 
            TAGS 
        */
        if (config.Tags.Enabled && message.content.startsWith(config.Tags.Prefix)) {
            const name = message.content.slice(1, message.content.length);
            const tags = config.Tags.Tags;
            const tag = tags.find(t => t.Command.toLowerCase() == name.toLowerCase());
            if (tag) {
                message.delete();
                message.channel.send(Embed({
                    title: tag.Title,
                    description: tag.Description
                }))
            }
        }

        const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(message.channel.id);

        if (ticket) {
            if (config.Waiting_Responded.Enabled) {
                let waiting = Utils.findChannel(config.Waiting_Responded.Waiting, message.guild, 'category');
                let responded = Utils.findChannel(config.Waiting_Responded.Responded, message.guild, 'category');

                if (ticket.category) {
                    const category = config.Categories.Categories.find(c => c.Title == ticket.category);

                    if (category) {
                        const discordCategory = Utils.findChannel(category.Discord_Category, message.guild, 'category');
                        if (discordCategory) responded = discordCategory;
                    }
                }

                if (Utils.hasPermission(message.member, config.Waiting_Responded.SupportRole)) {
                    message.channel.setParent(responded.id, { lockPermissions: false });
                } else {
                    message.channel.setParent(waiting.id, { lockPermissions: false });
                }
            }
        }

        /*
            PINGS
        */
        if (config.Pings.User) {
            const ticket = await Utils.variables.db.get.getTickets(message.channel.id);
            if (ticket && message.author.id !== ticket.creator)
                message.channel.send(`<@${ticket.creator}>`).then(msg => msg.delete({ timeout: config.Pings.Delete_After * 1000 }));
        }

        if (config.Pings.Category_Role) {
            const mainTicket = await Utils.variables.db.get.getTickets(message.channel.id);
            if (mainTicket && message.author.id == mainTicket.creator) {
                const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(message.channel.id);
                const category_name = (ticket ? ticket.category || "" : "").trim();
                if (category_name) {
                    const category = config.Categories.Categories.find(c => c.Title.toLowerCase() == category_name.toLowerCase());

                    if (category) {
                        const role = Utils.findRole(category.Role, message.guild, false);
                        if (role)
                            message.channel.send(`<@&${role.id}>`).then(msg => msg.delete({ timeout: config.Pings.Delete_After * 1000 })).catch(err => { });
                    }
                }
            }
        }
    })

    EventHandler.set('raw', async (bot, event) => {
        if (event.t !== "MESSAGE_REACTION_ADD") return;

        const { d: data } = event;
        const user = bot.users.cache.get(data.user_id);

        if (!user || user.bot) return;

        const channel = bot.channels.cache.get(data.channel_id);
        const message = await channel.messages.fetch(data.message_id);
        const emojiKey = (data.emoji.id) ? data.emoji.id : data.emoji.name;
        const member = message.guild.member(user.id);

        const embeds = message.embeds;

        /* 
            REACT TO OPEN TICKET 
        */
        if (emojiKey == config.ReactToOpenTicket.Emoji && embeds.length > 0) {
            if (embeds[0].title == lang.React_To_Open_Ticket.Title) {
                const ticketEmbed = db.prepare("SELECT * FROM reactionEmbeds WHERE message=?").get(message.id);
                if (ticketEmbed) {
                    message.reactions.cache.get(emojiKey).users.remove(user.id);
                    if (!ticketEmbed.category) {
                        createTicket(bot, [], member, channel, true, 10000, false);
                    } else {
                        console.log("1");
                        const category = config.Categories.Categories.find(c => c.Title == ticketEmbed.category)
                        if (category) {
                            const ch = await createTicket(bot, [], member, channel, true, 10000, false, category.Discord_Category);

                            const { Role, Title, Questions } = category;

                            db.prepare("INSERT INTO tickets VALUES(?, ?)").run(ch.id, Title);

                            const role = Utils.findRole(Role, ch.guild);

                            const responses = [];

                            const askQuestion = async (i) => {
                                await ch.send(Embed({
                                    title: Questions[i]
                                }))

                                Utils.waitForResponse(user.id, ch)
                                    .then(response => {
                                        let content = response.content;

                                        if (response.attachments.size > 0) {
                                            content += "\n\n" + lang.Tickets.Answers.Attachments.replace(/{attachments}/g, response.attachments.map(attachment => attachment.proxyURL).join('\n'));
                                        }

                                        responses.push(content);

                                        if (i >= Questions.length - 1) complete();
                                        else askQuestion(++i);
                                    })
                            }
                            askQuestion(0);

                            const complete = async () => {
                                await ch.bulkDelete(Questions.length * 2);

                                if (config.Categories.Ping_Role) {
                                    await ch.send(`<@&${role.id}>`, {
                                        embed: Embed({
                                            description: Questions.map((question, i) => `> **${question}**\n${responses[i]}`).join("\n\n")
                                        }).embed
                                    });
                                } else {
                                    ch.send(Embed({
                                        description: Questions.map((question, i) => `> **${question}**\n${responses[i]}`).join("\n\n")
                                    }))
                                }
                                await ch.send(Utils.setupEmbed({
                                    configPath: {
                                        Title: config.Categories.Message.replace(/{category}/g, Title)
                                    },
                                    variables: Utils.userVariables(member, "-")
                                }))

                                if (config.Categories.Commissions.Enabled) {
                                    const commissions = Utils.findChannel(config.Categories.Commissions.Channel, channel.guild);

                                    if (!commissions) return;

                                    commissions.send(Utils.setupEmbed({
                                        configPath: lang.Commissions.Listing,
                                        variables: [
                                            { searchFor: /{userPFP}/g, replaceWith: user.displayAvatarURL({ dynamic: true }) },
                                            { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                                            { searchFor: /{user}/g, replaceWith: `<@${user.id}>` }
                                        ],
                                        fields: [...Questions.map((question, i) => {
                                            return {
                                                name: question,
                                                value: responses[i]
                                            }
                                        }), {
                                            name: "Category",
                                            value: Title
                                        }, {
                                            name: "Channel",
                                            value: "<#" + ch.id + ">"
                                        }]
                                    }))
                                        .then(msg => {
                                            msg.react("✅");
                                        })
                                }
                            }
                        } else {
                            createTicket(bot, [], member, channel, true, 10000, false);
                        }
                    }
                }
            }
        }


        /*
            CATEGORIES
        */
        const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(channel.id);

        if (config.Categories.Enabled && embeds.length == 1 && embeds[0].title == bot_embeds.Embeds.Ticket.Title && message.editedAt && !ticket.category) {
            const ticket = await Utils.variables.db.get.getTickets(channel.id);
            if (!ticket) return;

            if (emojiKey == "❌") {
                return closeTicket(bot, [], member, channel, false);
            }

            const categories = config.Categories.Categories;
            const category = categories.find(c => c.Emoji.Unicode == emojiKey);
            if (category) {
                const discordCategory = Utils.findChannel(category.Discord_Category, channel.guild, 'category');
                if (discordCategory) await channel.setParent(discordCategory.id, { lockPermissions: false });

                db.prepare("UPDATE tickets SET category=? WHERE id=?").run(category.Title, channel.id);

                if (config.Categories.Disable_Speaking_Until_Category_Chosen) {
                    await channel.updateOverwrite(ticket.creator, {
                        'SEND_MESSAGES': true,
                        'VIEW_CHANNEL': true,
                        'READ_MESSAGE_HISTORY': true
                    })
                }

                message.reactions.cache.forEach(async reaction => {
                    await reaction.remove();
                });

                const { Role, Title, Questions } = category;
                const role = Utils.findRole(Role, message.guild);

                const support = Utils.findRole(bot_config.Tickets.SupportRole, channel.guild);

                // Remove support role permission
                const overwrites = message.channel.permissionOverwrites;
                if (role.id !== support.id) {
                    const overwrite = overwrites.find(o => o.type == "role" && o.id == support.id);
                    if (overwrite) await overwrite.delete();

                    await message.channel.updateOverwrite(role.id, {
                        'SEND_MESSAGES': true, 'VIEW_CHANNEL': true, 'READ_MESSAGE_HISTORY': true
                    });
                }

                const responses = [];

                const askQuestion = async (i) => {
                    await channel.send(Embed({
                        title: Questions[i]
                    }))

                    Utils.waitForResponse(user.id, message.channel)
                        .then(response => {
                            let content = response ? response.content : "";

                            if (response && response.attachments.size > 0) {
                                content += "\n\n" + lang.Tickets.Answers.Attachments.replace(/{attachments}/g, response.attachments.map(attachment => attachment.proxyURL).join('\n'));
                            }

                            responses.push(content);

                            if (i >= Questions.length - 1) complete();
                            else askQuestion(++i);
                        })
                }
                askQuestion(0);

                const complete = async () => {
                    await channel.bulkDelete(Questions.length * 2);
                    if (config.Categories.Ping_Role) {
                        await channel.send(`<@&${role.id}>`, {
                            embed: Embed({
                                description: Questions.map((question, i) => `> **${question}**\n${responses[i]}`).join("\n\n")
                            }).embed
                        });
                    } else {
                        channel.send(Embed({
                            description: Questions.map((question, i) => `> **${question}**\n${responses[i]}`).join("\n\n")
                        }))
                    }

                    await channel.send(Utils.setupEmbed({
                        configPath: {
                            Title: config.Categories.Message.replace(/{category}/g, Title)
                        },
                        variables: Utils.userVariables(member, "-")
                    }))

                    if (config.Categories.Commissions.Enabled) {
                        const commissions = Utils.findChannel(config.Categories.Commissions.Channel, channel.guild);

                        if (!commissions) return;

                        commissions.send(Utils.setupEmbed({
                            configPath: lang.Commissions.Listing,
                            variables: [
                                { searchFor: /{userPFP}/g, replaceWith: user.displayAvatarURL({ dynamic: true }) },
                                { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                                { searchFor: /{user}/g, replaceWith: `<@${user.id}>` }
                            ],
                            fields: [...Questions.map((question, i) => {
                                return {
                                    name: question,
                                    value: responses[i]
                                }
                            }), {
                                name: "Channel",
                                value: "<#" + message.channel.id + ">"
                            }]
                        }))
                            .then(msg => {
                                msg.react("✅");
                            })
                    }
                }
            }
        }

        /*
            COMMISSIONS
        */
        if (config.Categories.Commissions.Enabled
            && emojiKey == config.Categories.Commissions.Emoji
            && message.channel.name.toLowerCase() == config.Categories.Commissions.Channel.toLowerCase()) {
            const embed = message.embeds[0];

            if (embed.title == lang.Commissions.Listing.Title && embed.description == lang.Commissions.Listing.Description) {
                const fields = embed.fields;
                const channelField = fields.find(f => f.name == "Channel");
                const channelID = (channelField.value.match(/\d{18}/) || "0")[0];

                const ticket = bot.channels.cache.get(channelID);
                if (!ticket) return message.channel.send(Embed({
                    preset: 'error',
                    description: "I cannot find the channel that is linked to that commission."
                }));

                const dbTicket = await Utils.variables.db.get.getTickets(ticket.id);

                if (!dbTicket) return message.channel.send(Embed({
                    preset: 'error',
                    description: "That ticket is not in the database."
                }));

                ticket.send(Utils.setupEmbed({
                    configPath: lang.Commissions.Claimed.Ticket,
                    variables: [
                        { searchFor: /{userPFP}/g, replaceWith: user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{user}/g, replaceWith: `<@${user.id}>` }
                    ]
                }));

                message.delete();

                message.reactions.cache.get(emojiKey).remove();
            }
        }
    })

    /*
        RESPONSE TIMES
    */
    if (config.Response_Times.Enabled) {
        CommandHandler.set({
            name: config.Response_Times.Command,
            run: async (bot, message, args) => {
                const responseTimes = db.prepare("SELECT response FROM responseTimes").all().map(response => parseInt(response.response));

                const total = responseTimes.length == 0 ? 0 :
                    // If there are no response times recorded, default to 0
                    responseTimes.reduce((acc, curr) => acc + curr);
                const average = ~~(total / responseTimes.length);

                const time = Utils.DDHHMMSSfromMS(average);

                message.channel.send(Utils.setupEmbed({
                    configPath: lang.Response_Time, variables: [
                        { searchFor: /{userPFP}/g, replaceWith: message.author.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{response_time}/g, replaceWith: time }
                    ]
                }))
            },
            description: "View our average ticket response time",
            usage: config.Response_Times.Command,
            aliases: [],
            type: "addon"
        })
    }

    /* 
        UP/DOWN
    */
    if (config.Up_Down.Enabled) {
        CommandHandler.set({
            name: config.Up_Down.Up_Command,
            run: async (bot, message, args) => {
                if (!Utils.hasPermission(message.member, config.Up_Down.Permission)) return message.channel.send(Embed({ preset: 'nopermission' }));

                const mainTicket = await Utils.variables.db.get.getTickets(message.channel.id);
                const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(message.channel.id);

                if (!mainTicket || !ticket) return message.channel.send(Embed({ preset: 'error', description: "This ticket is not in the database." }));

                const category_name = (ticket ? ticket.category || "" : "").trim();
                if (!category_name) return message.channel.send(Embed({ preset: "error", description: "I could not find a category for this ticket." }));

                const categories = config.Categories.Categories;

                const category = categories.find(c => c.Title.toLowerCase() == category_name.toLowerCase());
                if (!category) return message.channel.send(Embed({ preset: "error", description: "The category for this ticket no longer exists." }));

                const index = categories.indexOf(category);
                const next_category = categories[index + 1];
                if (index >= categories.length - 1 || !next_category) return message.channel.send(Embed({ preset: "error", description: "This ticket cannot be moved up any further." }));

                db.prepare("UPDATE tickets SET category=? WHERE id=?").run(next_category.Title, message.channel.id);

                const old_role = Utils.findRole(category.Role, message.guild);
                const new_role = Utils.findRole(next_category.Role, message.guild);

                const overwrites = message.channel.permissionOverwrites;

                const overwrite = overwrites.find(o => o.type == "role" && o.id == old_role.id);
                overwrite ? overwrite.delete() : ""

                await message.channel.updateOverwrite(new_role.id, {
                    'SEND_MESSAGES': true, 'VIEW_CHANNEL': true, 'READ_MESSAGE_HISTORY': true
                });

                const discord_category = Utils.findChannel(next_category.Discord_Category, message.guild, "category");
                message.channel.setParent(discord_category, { lockPermissions: false });

                message.channel.send(Embed({
                    color: bot_config.EmbedColors.Success,
                    title: lang.Up_Down.Moved_Up.Title
                        .replace(/{old}/g, category.Title)
                        .replace(/{new}/g, next_category.Title),
                    description: lang.Up_Down.Moved_Up.Description
                        .replace(/{old}/g, category.Title)
                        .replace(/{new}/g, next_category.Title)
                }))
            },
            description: "Move a ticket up",
            usage: config.Up_Down.Up_Command,
            aliases: [],
            type: "addon"
        })

        CommandHandler.set({
            name: config.Up_Down.Down_Command,
            run: async (bot, message, args) => {
                if (!Utils.hasPermission(message.member, config.Up_Down.Permission)) return message.channel.send(Embed({ preset: 'nopermission' }));

                const mainTicket = await Utils.variables.db.get.getTickets(message.channel.id);
                const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(message.channel.id);

                if (!mainTicket || !ticket) return message.channel.send(Embed({ preset: 'error', description: "This ticket is not in the database." }));

                const category_name = (ticket ? ticket.category || "" : "").trim();
                if (!category_name) return message.channel.send(Embed({ preset: "error", description: "I could not find a category for this ticket." }));

                const categories = config.Categories.Categories;

                const category = categories.find(c => c.Title.toLowerCase() == category_name.toLowerCase());
                if (!category) return message.channel.send(Embed({ preset: "error", description: "The category for this ticket no longer exists." }));

                const index = categories.indexOf(category);
                const next_category = categories[index - 1];
                if (index <= 0 || !next_category) return message.channel.send(Embed({ preset: "error", description: "This ticket cannot be moved down any further." }));

                db.prepare("UPDATE tickets SET category=? WHERE id=?").run(next_category.Title, message.channel.id);

                const old_role = Utils.findRole(category.Role, message.guild);
                const new_role = Utils.findRole(next_category.Role, message.guild);

                const overwrites = message.channel.permissionOverwrites;

                const overwrite = overwrites.find(o => o.type == "role" && o.id == old_role.id);
                overwrite ? overwrite.delete() : ""

                await message.channel.updateOverwrite(new_role.id, {
                    'SEND_MESSAGES': true, 'VIEW_CHANNEL': true, 'READ_MESSAGE_HISTORY': true
                });

                const discord_category = Utils.findChannel(next_category.Discord_Category, message.guild, "category");
                message.channel.setParent(discord_category, { lockPermissions: false });

                message.channel.send(Embed({
                    color: bot_config.EmbedColors.Success,
                    title: lang.Up_Down.Moved_Down.Title
                        .replace(/{old}/g, category.Title)
                        .replace(/{new}/g, next_category.Title),
                    description: lang.Up_Down.Moved_Down.Description
                        .replace(/{old}/g, category.Title)
                        .replace(/{new}/g, next_category.Title)
                }))
            },
            description: "Move a ticket down",
            usage: config.Up_Down.Down_Command,
            aliases: [],
            type: "addon"
        })
    }

    /*
        MOVE COMMAND
    */
    if (config.Move.Enabled) {
        CommandHandler.set({
            name: config.Move.Command,
            run: async (bot, message, args) => {
                if (!Utils.hasPermission(message.member, config.Move.Permission)) return message.channel.send(Embed({ preset: 'nopermission' }));

                const mainTicket = await Utils.variables.db.get.getTickets(message.channel.id);
                const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(message.channel.id);

                if (!mainTicket || !ticket) return message.channel.send(Embed({ preset: 'error', description: "This ticket is not in the database." }));

                const new_category_name = args.join(" ");
                if (new_category_name == "" || args.length == 0) return message.channel.send(Embed({ preset: "invalidargs", usage: "move <category>" }));

                const old_category_name = (ticket ? ticket.category || "" : "").trim();
                if (!old_category_name) return message.channel.send(Embed({ preset: "error", description: "I could not find a category for this ticket." }));

                const categories = config.Categories.Categories;

                const new_category = categories.find(c => c.Title.toLowerCase() == new_category_name.toLowerCase());
                if (!new_category) return message.channel.send(Embed({ preset: "error", description: "The ``" + new_category_name + "`` category does not exist." }));

                const old_category = categories.find(c => c.Title.toLowerCase() == old_category_name.toLowerCase());
                if (!old_category) return message.channel.send(Embed({ preset: "error", description: "The category for this ticket no longer exists." }));

                db.prepare("UPDATE tickets SET category=? WHERE id=?").run(new_category.Title, message.channel.id);

                const old_role = Utils.findRole(old_category.Role, message.guild);
                const new_role = Utils.findRole(new_category.Role, message.guild);

                const overwrites = message.channel.permissionOverwrites;

                const overwrite = overwrites.find(o => o.type == "role" && o.id == old_role.id);
                overwrite ? overwrite.delete() : ""

                await message.channel.updateOverwrite(new_role.id, {
                    'SEND_MESSAGES': true, 'VIEW_CHANNEL': true, 'READ_MESSAGE_HISTORY': true
                });

                const discord_category = Utils.findChannel(new_category.Discord_Category, message.guild, "category");
                message.channel.setParent(discord_category, { lockPermissions: false });

                message.channel.send(Embed({
                    color: bot_config.EmbedColors.Success,
                    title: lang.Move.Moved.Title
                        .replace(/{old}/g, old_category.Title)
                        .replace(/{new}/g, new_category.Title),
                    description: lang.Move.Moved.Description
                        .replace(/{old}/g, old_category.Title)
                        .replace(/{new}/g, new_category.Title)
                }))
            },
            description: "Move a ticket to another category",
            usage: config.Move.Command + " <category>",
            aliases: [],
            type: "addon"
        })
    }

    const AutoClose = {
        notify: ms(config.AutoClose.Notify),
        close: ms(config.AutoClose.Close),
    }

    const checkTickets = async () => {
        bot.guilds.cache.forEach(async guild => {
            guild.channels.cache
                .filter(c => /ticket-\d{4}/.test(c.name.toLowerCase()))
                .forEach(async ticket => {
                    const createdAt = ticket.createdAt;
                    const dbTicket = await Utils.variables.db.get.getTickets(ticket.id);
                    if (!dbTicket) return;
                    ticket.messages.fetch()
                        .then(messages => {
                            /*
                                RESPONSE TIME TRACKER
                            */
                            if (config.Response_Times.Enabled) {
                                const staffMessages = messages.filter(m => !m.author.bot && m.member && Utils.hasPermission(m.member, config.Response_Times.SupportRole));
                                if (staffMessages.size >= 1) {
                                    const alreadyAdded = !!db.prepare("SELECT * FROM responseTimes WHERE ticket=?").get(ticket.id);
                                    if (!alreadyAdded) {
                                        const delay = staffMessages.first().createdAt - createdAt;
                                        db.prepare("INSERT INTO responseTimes VALUES(?, ?, ?)").run(delay, Date.now(), ticket.id);
                                    }
                                }
                            }


                            /*
                                AUTOCLOSE
                            */
                            if (config.AutoClose.Enabled) {
                                const userMessages = messages.filter(m => !m.author.bot && m.member && !Utils.hasPermission(m.member, config.Response_Times.SupportRole)).sort((a, b) => b.createdAt - a.createdAt);
                                if (userMessages.size >= 1) {
                                    const lastMessage = userMessages.first().createdAt;
                                    const delay = Date.now() - lastMessage;

                                    const autoclose_cancelled = db.prepare("SELECT * FROM autoclose_cancelled WHERE ticket=?").get(ticket.id);
                                    const alreadyNotified = db.prepare("SELECT * FROM notified WHERE ticket=?").get(ticket.id);
                                    if (!autoclose_cancelled && !alreadyNotified && delay >= AutoClose.notify) {
                                        ticket.send(Utils.setupEmbed({
                                            configPath: lang.AutoClose,
                                            variables: [
                                                { searchFor: /{userPFP}/g, replaceWith: bot.users.cache.get(dbTicket.creator).displayAvatarURL({ dynamic: true }) },
                                                { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                                                { searchFor: /{user}/g, replaceWith: `<@${dbTicket.creator}>` }
                                            ]
                                        }))
                                        db.prepare("INSERT INTO notified VALUES(?, ?)").run(ticket.id, Date.now());
                                    } else if (!autoclose_cancelled && alreadyNotified && delay >= AutoClose.close) {
                                        closeTicket(bot, ['Auto', 'Close'], ticket.guild.member(dbTicket.creator), ticket, false);
                                    }
                                }
                            }

                            /* 
                                REMIND AFTER X MINUTES
                            */
                            if (config.Categories.Reminder.Enabled) {
                                const embedMessages = messages.filter(m => m.embeds.length > 0);
                                if (embedMessages.size == 1) {
                                    ticket.send(Utils.setupEmbed({
                                        configPath: lang.Choose_Category_Reminder,
                                        variables: [
                                            { searchFor: /{userPFP}/g, replaceWith: bot.users.cache.get(dbTicket.creator).displayAvatarURL({ dynamic: true }) },
                                            { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                                            { searchFor: /{user}/g, replaceWith: `<@${dbTicket.creator}>` }
                                        ]
                                    }))
                                }
                            }
                        })
                })
        })
    }
    checkTickets();
    setInterval(checkTickets, 60000);

    CommandHandler.set({
        name: "ultimatetickets",
        run: async (bot, message, args) => {
            if (!Utils.hasPermission(message.member, config.Permission)) return message.channel.send(Embed({ preset: "nopermission" }));

            /* \n:pencil: Create a react-to-open-application embed */

            const embed = Embed({
                title: "Ticket Manager",
                description: ":envelope_with_arrow: Create a react-to-open-ticket embed\n:clock10: Reset response times\n:x: Cancel"
            })

            message.channel.send(embed)
                .then(async msg => {
                    const emojis = ["📩", /*"📝"*/, "🕙", "❌"];
                    emojis.forEach(async emoji => {
                        await msg.react(emoji);
                    })

                    Utils.waitForReaction(emojis, message.author.id, msg)
                        .then(async response => {
                            msg.delete();
                            const emoji = response.emoji.name;
                            if (emoji == "📩") {
                                // React to open ticket
                                if (config.Categories.Enabled) {
                                    message.channel.send(Embed({
                                        title: "Create a Ticket Embed!",
                                        description: "Specific category?\n\n✅ **Yes**\n❌ **No**"
                                    }))
                                        .then(async msg => {
                                            await msg.react("✅");
                                            await msg.react("❌");

                                            Utils.waitForReaction(["✅", "❌"], message.author.id, msg)
                                                .then(async response => {
                                                    if (response.emoji.name == "✅") {
                                                        let messageCount = 4;
                                                        const askForCategory = () => {
                                                            Utils.waitForResponse(message.author.id, message.channel)
                                                                .then(response => {
                                                                    if (response.content.toLowerCase() == "cancel") {
                                                                        return message.channel.send({
                                                                            preset: "error",
                                                                            description: ":x: **Cancelled**"
                                                                        })
                                                                    }
                                                                    const category = config.Categories.Categories.find(c => c.Title.toLowerCase() == response.content.toLowerCase());
                                                                    if (!category) {
                                                                        message.channel.send(Embed({
                                                                            description: "That is an invalid category. Please note that the name of the category should be the ``Title``. Please type the name again or say ``cancel``.",
                                                                            preset: "error"
                                                                        }))
                                                                        messageCount++;
                                                                        askForCategory();
                                                                    } else {
                                                                        message.channel.bulkDelete(messageCount);
                                                                        message.channel.send(Embed({
                                                                            title: lang.React_To_Open_Ticket.Title,
                                                                            description: lang.React_To_Open_Ticket.Category_Description
                                                                                .replace(/{category}/g, category.Title)
                                                                        }))
                                                                            .then(msg => {
                                                                                msg.react(config.ReactToOpenTicket.Emoji);

                                                                                db.prepare("INSERT INTO reactionEmbeds (message, category) VALUES(?, ?)").run(msg.id, category.Title);
                                                                            })
                                                                        message.channel.send(":white_check_mark: **Success!**").then(msg => msg.delete({ timeout: 5000 }));
                                                                    }
                                                                })
                                                        }

                                                        message.channel.send(Embed({
                                                            description: "Which category do you want this embed to open to?"
                                                        }))

                                                        askForCategory();
                                                    } else {
                                                        message.channel.bulkDelete(5);
                                                        message.channel.send(Embed({
                                                            title: lang.React_To_Open_Ticket.Title,
                                                            description: lang.React_To_Open_Ticket.Normal_Description
                                                        }))
                                                            .then(msg => {
                                                                msg.react(config.ReactToOpenTicket.Emoji);

                                                                db.prepare("INSERT INTO reactionEmbeds (message, category) VALUES(?, ?)").run(msg.id, null);
                                                            })
                                                        message.channel.send(":white_check_mark: **Success!**").then(msg => msg.delete({ timeout: 5000 }));
                                                    }
                                                })
                                        })
                                } else {
                                    message.channel.bulkDelete(4);
                                    message.channel.send(Embed({
                                        title: lang.React_To_Open_Ticket.Title,
                                        description: lang.React_To_Open_Ticket.Normal_Description
                                    }))
                                        .then(msg => {
                                            msg.react(config.ReactToOpenTicket.Emoji);

                                            db.prepare("INSERT INTO reactionEmbeds (message, category) VALUES(?, ?)").run(msg.id, null);
                                        })
                                    message.channel.send(":white_check_mark: **Success!**").then(msg => msg.delete({ timeout: 5000 }));
                                }
                            } else if (emoji == "📝") {
                                // React to open application
                            } else if (emoji == "🕙") {
                                const confirm = await message.channel.send(Embed({
                                    title: "Are you sure you want to reset **all** response times (this will set the response time to 0 secs)? (yes/no)"
                                }))
                                Utils.waitForResponse(message.author.id, message.channel)
                                    .then(async response => {
                                        confirm.delete();
                                        response.delete();

                                        if (response.content.toLowerCase() == "yes") {
                                            db.prepare("DELETE FROM responseTimes").run();
                                            message.channel.send(Embed({
                                                title: "Response Times Reset",
                                                description: "The response times have been reset.",
                                                color: bot_config.EmbedColors.Success
                                            }))
                                        } else {
                                            message.channel.send(Embed({
                                                title: ":x: Cancelled!",
                                                color: bot_config.EmbedColors.Error
                                            })).then(msg => msg.delete({ timeout: 10000 }))
                                        }
                                    })
                            } else if (emoji == "❌") {
                                message.channel.send(Embed({
                                    title: ":x: Cancelled!",
                                    color: bot_config.EmbedColors.Error
                                })).then(msg => msg.delete({ timeout: 10000 }))
                            }
                        })
                })
        },
        description: "Ultimate Tickets configuration command",
        usage: "ultimatetickets",
        aliases: [
            "ut"
        ],
        type: "addon"
    })

    /*
        CLOSE TICKET ON LEAVE
    */
    if (config.Close_Ticket_On_Leave) {
        EventHandler.set('guildMemberRemove', async (bot, member) => {
            if (member.user.bot) return;
            member.guild.channels.cache
                .filter(c => c.name.toLowerCase().startsWith("ticket-"))
                .forEach(async ticket => {
                    const dbTicket = await Utils.variables.db.get.getTickets(ticket.id);

                    if (dbTicket && dbTicket.creator == member.id) {
                        closeTicket(bot, ["User", "left", "server"], member, ticket, false);
                    }
                })
        })
    }

    /*
        AUTOCLOSE CANCEL
    */
    CommandHandler.set({
        name: config.AutoClose_Cancel.Command,
        run: async (bot, message, args) => {
            if (!Utils.hasPermission(message.member, config.AutoClose_Cancel.Permission)) return message.channel.send(Embed({ preset: 'nopermission' }));

            const ticket = await Utils.variables.db.get.getTickets(message.channel.id);

            if (!ticket) return message.channel.send(Embed({ preset: 'error', description: "This ticket is not in the database." }));

            db.prepare("INSERT INTO autoclose_cancelled VALUES(?)").run(ticket.id);

            message.channel.send(Embed({
                color: bot_config.EmbedColors.Success,
                title: 'AutoClose Cancelled',
                description: "AutoClose has been cancelled."
            }))
        },
        description: 'Prevent a ticket from auto-closing',
        usage: config.AutoClose_Cancel.Command,
        aliases: []
    })

    console.log(infoPrefix, "Addon loaded");
}