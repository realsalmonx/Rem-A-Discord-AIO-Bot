const Utils = require("../modules/utils.js");
const CommandHandler = require('../modules/handlers/CommandHandler');
const EventHandler = require('../modules/handlers/EventHandler');
const CustomConfig = require('../modules/CustomConfig.js');
const ytdl = require('ytdl-core');
const YoutubeAPI = require("simple-youtube-api");
const request = require('request-promise');
const chalk = require("chalk");
// const fs = require("fs");

const servers = new Map()
const Embed = Utils.Embed;
const config = new CustomConfig('./addon_configs/ultimatemusic.yml', { // UM
    YouTubeAPIKey: "PUT-YOUTUBE-API-KEY-HERE",
    NowPlayingMessages: true, // UM
    PreventSongDuplicates: false,
    PlayFirstResult: false,
    VoteSkip: {
        Ping: true,
        "~1": "Should the bot ping the members in the voice channel?",
        TimeLimit: 30,
        "~2": "Time everyone has to vote to skip or not skip in seconds",
    },
    AutoPlay: {
        Enabled: false,
        Playlist: "PUT-YOUTUBE-PLAYLIST-LINK-HERE",
        VoiceChannel: "music",
        TextChannel: "music",
        NowPlayingMessages: false,
        AnnounceStartOrRestart: true,
        StartBackUp: true
    }, // UM
    Lang: {
        Errors: {
            NotInVoiceChannel: 'You must be in a voice channel to run this command.',
            NotPlayingMusic: "The bot is currently not playing music.",
            AlreadyInRepeat: "The bot is already set to that repeat mode!", // UM
            NotEnoughSongsToShuffle: "There are not enough songs in the queue to shuffle! You must have at least 3 songs in the queue.", // UM
            CouldntGetSongLyrics: "An error occured while getting the song lyrics. Try again later", // UM
            CantRemoveFirstSong: "You cannot remove the first song from the queue!", // UM
            InvalidSkiptoPosition: 'That is not a valid position in the queue!', // UM
            CantSkiptoPosition: 'You cannot use the skipto command to skip to that postion!', // UM
            InvalidVolumeInt: 'You must provide an integer between 0 and 10.', // UM
            CantSkip: "You can not skip because the music queue only has one song.",
            NotPaused: "The bot is already playing music.",
            AlreadyPlayingMusic: "I am already playing music in another voice channel.",
            InvalidPermissions: "I do not have the required permissions to join or speak in this voice channel.",
            NotAllInfoObtained: "Information for one of the songs requested could not be found.",
            NoSearchResults: ["No search results could be found for that search query", "Top 10 search results for `{search}` could not be found"],
            InvalidPageNumber: "That is not a valid page number!",
            NotInRepeat: "The bot is currently not on any repeat mode" // UM
        },
        Embeds: {
            NowPlaying: {
                Title: "🎶 Now playing:",
                RequestBy: "Requested By",
                Length: "Song Length: {length}"
            },
            AddedToQueue: {
                Song: "📜 Added to Queue:",
                Playlist: "📜 Added Playlist to Queue:",
                PlaylistLength: "{amount} songs in playlist",
            },
            Top10: {
                Title: "Top Results",
                Description: "Displaying top search results for `{search}`. Select a video to add to the queue by responding with it's corresponding number. \n\n{results}"
            },
            Queue: {
                Title: "Music Queue (Page #{page})",
                Description: "{queue}\nRepeat Mode: `{mode}`\n{extra}", // UM
                ExtraInfo_Queue: "*The queue will be repeated after it's over!*", // UM
                ExtraInfo_Song: "*The current track will be repeated after it's over!*", // UM
                CurrentlyPlaying: "🎶 **Currently Playing:** [{song-name}]({song-url})\n\n"
            },
            Pause: {
                Title: "⏸️ Paused song:",
                Description: "{song-name}"
            },
            Resume: {
                Title: "🎶 Resumed playing:",
                Description: "{song-name}"
            },
            Skip: {
                Title: "⏭️ Skipping song..."
            },
            StoppedMusic: {
                Title: "⏹️ Music Stopped",
                Description: "You stopped the music queue!"
            },
            CurrentVolume: { // UM
                Title: "🔈 Current Volume",
                Description: "The current volume is **{volume}**.\nSet the volume with ``-volume <0-10>``"
            },
            VolumeSet: {
                Title: "🔈 Volume Set",
                Description: "The volume has been set to **{volume}**."
            },
            CurrentlyPlaying: {
                Title: "🎵 Now Playing",
                Fields: ["Title", "Creator", "Length", "Requested By"]
            },
            Skipto: {
                Title: ":track_next: Songs Skipped",
                Description: "You skipped to position `{position}` in the queue"
            },
            Remove: {
                Title: ":wastebasket: Song Removed",
                Description: "You removed the song at position `{position}` in the queue"
            },
            Lyrics: {
                Title: "{song-name} Lyrics",
                Description: "**Artist:** {artist}\n\n{lyrics}"
            },
            Shuffle: {
                Title: "Songs Shuffled",
                Description: "The songs have been suffled!\n\n**New Queue:**\n{shuffledqueue}"
            },
            Repeat: {
                Title: "🔁 Repeat",
                Description: "You turned on `{type}` repeat! Turn off repeat mode with **-repeat off**\n{extra}",
                ExtraInfo_Song: "The current track will be repeated till this is turned off!",
                ExtraInfo_Queue: "The queue and songs added to the queue will be repeated once the queue ends!"
            },
            SongRepeating: {
                Title: "🔁 Song Repeat",
                Description: "Repeating the current track...",
            },
            QueueRepeating: {
                Title: "🔁 Queue Repeat",
                Description: "Repeating the saved queue...",
            },
            Restart: {
                Title: "🔂 Song Restarted",
                Description: "The current track has been restarted!"
            },
            Voteskip: {
                Title: "Vote Skip",
                Description: "All users in the voice channel have **30 seconds** to cast in their votes! If more people vote to skip the song than not to skip the song, the song will be skipped.\n\n:white_check_mark:: **Skip the song**\n:x:: **Don't skip the song**\n\n**Time left:** Less than **{timeleft}** seconds"
            },
            Voteskip_Skipped: {
                Title: ":track_next: Song Skipped",
                Description: "More people voted to skip the song than people voted to **not** skip the song! The song is now being skipped..."
            },
            Voteskip_NotSkipped: {
                Title: ":no_entry_sign: Song Not Skipped",
                Description: "More people voted to **not** skip the song than people voted to skip the song! The song will **not** be skipped."
            }, // UM
            QueueOver: {
                Title: "⏹️ Stopping Music",
                Description: "The music queue is now over"
            },
            Join: {
                Title: "☎️ Joined voice channel"
            },
            Leave: {
                Title: "👋 Leaving voice channel"
            }
        },
        AutoPlay: { // UM
            Starting: 'Starting auto play...',
            Restarting: "Restarting auto play...",
            Stopping: "Stopping auto play...",
            InvalidAutoplayPlaylist: "The set auto play playlist is not a valid youtube playlist link",
            AutoPlay: "Auto Play"
        },
        PreventSongDuplicates: {
            PlaylistAlreadyInQueue: "You can not add this playlist because all the songs are already in the queue",
            PlaylistSongsFiltered: "**{amount}** videos were filtered out because they were already in the playlist.",
            AlreadyInQueue: "You can not add this song because it already exists in the queue!"
        }, // UM
        CommandDescriptions: {
            play: "Play a song in the voice channel you are in.",
            stop: "Stop the bot from playing music.",
            queue: "View the song queue",
            skip: "Skip to a certain song in the queue",
            pause: "Pause the current song",
            resume: "Resume the current song",
            volume: "Set the bot's volume", // UM
            nowplaying: "View the current song",
            skipto: "Skip to a song in the queue",
            removesong: "Remove a song from the queue",
            lyrics: "View the lyrics for a song",
            shuffle: "Shuffle the song queue",
            repeat: "Set repeat mode for the current song",
            voteskip: "Vote to skip the current song",
            restart: "Replay the current song", // UM
            join: "Have the bot join your voice channel"
        }
    },
    RequiredRanks: {
        play: "@everyone",
        stop: "@everyone",
        queue: "@everyone",
        skip: "@everyone",
        pause: "@everyone",
        resume: "@everyone",
        volume: "@everyone", // UM
        nowplaying: "@everyone",
        skipto: "@everyone",
        removesong: "@everyone",
        lyrics: "@everyone",
        shuffle: "@everyone",
        repeat: "@everyone",
        voteskip: "@everyone",
        restart: "@everyone", // UM
        join: "@everyone"
    }
})
let YT;
let savedQueue;

module.exports = async bot => {
    Utils.addStatusPlaceholder(/{current-song-name}/g, "Nothing");
    Utils.addStatusPlaceholder(/{current-song-artist}/g, "Nobody");

    let musicAddonPrefix = chalk.hex("#ffd166").bold("[ULTIMATE MUSIC] ") // UM
    //let musicAddonPrefix = chalk.hex("#2bbcff").bold("[MUSIC] ");
    let infoPrefix = Utils.infoPrefix;
    let errorPrefix = Utils.errorPrefix;

    //if (fs.existsSync("./addons/ultimatemusic.js")) return console.log(infoPrefix + musicAddonPrefix + "Unloading normal music addon...");

    YT = new YoutubeAPI(config.YouTubeAPIKey);
    let autoPlaying = config.AutoPlay.Enabled ? true : false; // UM
    let queueEmbeds = new Map();

    class Server {
        constructor(message, guild, connection) {
            this.guild = message ? message.guild : guild
            this.textChannel = message ? message.channel : Utils.findChannel(config.AutoPlay.TextChannel, guild, 'text') // UM
            this.voiceChannel = message ? message.member.voice.channel : Utils.findChannel(config.AutoPlay.VoiceChannel, guild, 'voice') // UM
            this.songs = []
            this.connection = connection ? connection : null
            this.volume = 5
            this.paused = false
            this.repeat = null // UM
        }
    }

    class Song {
        constructor(video, requestedBy) {
            const thumbnails = Object.values(video.thumbnails);
            const format = unit => unit.toString().length > 1 ? unit.toString() : unit == 0 ? false : `0${unit}`;

            this.requestedBy = requestedBy
            this.url = "https://www.youtube.com/watch?v=" + video.id
            this.title = video.title
            this.image = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : "https://s.ytimg.com/yts/img/meh_mini-vfl0Ugnu3.png"
            this.author = {
                name: video.channel.title,
                link: "https://www.youtube.com/channel/" + video.channel.id
            }

            if (video.duration && video.duration.seconds) video.duration.seconds--;
            this.duration = video.duration ? Object.values(video.duration).map(unit => format(unit)).filter(unit => unit).join(":") : undefined
        }

        async getDuration() {
            const format = unit => unit.toString().length > 1 ? unit.toString() : unit == 0 ? false : `0${unit}`;
            const videoData = await YT.getVideo(this.url);

            videoData.duration.seconds--;
            this.duration = videoData.duration ? Object.values(videoData.duration).map(unit => format(unit)).filter(unit => unit).join(":") : undefined
        }
    }

    async function play(message, song, guild = undefined) {
        guild = !!guild ? guild : message.guild

        let server = servers.get(guild.id)

        if (!server) {
            server = new Server(message, guild)
            servers.set(guild.id, server)
            server.songs.push(song)
        }

        if (!server.connection) server.connection = await server.voiceChannel.join()

        let dispatcher;

        try {
            dispatcher = server.connection.play(await ytdl(song.url, { highWaterMark: 1 << 25, quality: "highestaudio" }));
        } catch (e) {
            const handle = () => {
                server.songs.shift()

                if (server.songs.length) {
                    if ((!autoPlaying && config.NowPlayingMessages) || (autoPlaying && config.AutoPlay.NowPlayingMessages)) server.textChannel.send(Embed({ // UM
                        title: config.Lang.Embeds.NowPlaying.Title,
                        fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: message ? '<@' + message.author.id + '>' : config.Lang.AutoPlay.AutoPlay, inline: true }], // UM
                        thumbnail: server.songs[0].image,
                        timestamp: new Date()
                    }))

                    return play(message, server.songs[0], guild)
                }
                else {
                    Utils.addStatusPlaceholder(/{current-song-name}/g, "Nothing");
                    Utils.addStatusPlaceholder(/{current-song-artist}/g, "Nobody");

                    server.connection.dispatcher ? server.connection.dispatcher.destroy() : "";
                    guild.me.voice.channel.leave();
                    servers.delete(guild.id);
                }
            }

            if (e.message == "Status code: 429") {
                server.textChannel.send(Embed({ preset: "error", description: "You cannot play music right now because you are being rate-limited by YouTube" }));

                Utils.addStatusPlaceholder(/{current-song-name}/g, "Nothing");
                Utils.addStatusPlaceholder(/{current-song-artist}/g, "Nobody");

                server.connection.dispatcher ? server.connection.dispatcher.destroy() : "";
                guild.me.voice.channel.leave();
                return servers.delete(guild.id);
            } else if (e.message.includes("This is a private video.")) {
                server.textChannel.send(Embed({ preset: "error", description: "This video is privated. " + (server.songs.length - 1 ? "Attempting to play the next song..." : "Ending queue.") }));
            } else {
                server.textChannel.send(Embed({ preset: "error", description: "This video could not be played right now. Try playing the song later. " + (server.songs.length - 1 ? "Attempting to play the next song..." : "Ending queue.") }));
                Utils.error(e.message, `${e.stack}\n\nVideo URL: ${song.url}`, undefined, false);
            }

            return handle();
        }

        Utils.addStatusPlaceholder(/{current-song-name}/g, song.title)
        Utils.addStatusPlaceholder(/{current-song-artist}/g, song.author.name)

        dispatcher.setVolumeLogarithmic(server.volume / 5);

        dispatcher.on('finish', async () => {
            if (server.repeat) { // UM
                if (server.repeat.mode.toLowerCase() === "song") {
                    server.songs.unshift(server.songs[0])

                    if (server.repeat.broadcast) server.textChannel.send(Embed({
                        title: config.Lang.Embeds.SongRepeating.Title,
                        description: config.Lang.Embeds.SongRepeating.Description
                    }))
                }
                if (server.repeat.mode.toLowerCase() === "queue") {
                    if (server.songs.length == 1) {

                        server.songs = JSON.parse(JSON.stringify(savedQueue));
                        server.songs.unshift(savedQueue[0])

                        if (server.repeat.broadcast) server.textChannel.send(Embed({
                            title: config.Lang.Embeds.QueueRepeating.Title,
                            description: config.Lang.Embeds.QueueRepeating.Description
                        }))
                    }
                }
            } // UM
            server.songs.shift();
            if (server.songs.length > 0) {
                play(message, server.songs[0], guild)
                if ((!autoPlaying && config.NowPlayingMessages) || (autoPlaying && config.AutoPlay.NowPlayingMessages)) return server.textChannel.send(Embed({ // UM
                    title: config.Lang.Embeds.NowPlaying.Title,
                    fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: message ? '<@' + message.author.id + '>' : config.Lang.AutoPlay.AutoPlay, inline: true }], // UM
                    thumbnail: server.songs[0].image,
                    timestamp: new Date()
                }));
            } else {
                Utils.addStatusPlaceholder(/{current-song-name}/g, "Nothing");
                Utils.addStatusPlaceholder(/{current-song-artist}/g, "Nobody");

                if (guild.me.voice.channel) guild.me.voice.channel.leave();
                servers.delete(server.guild.id);
                server.textChannel.send(Embed({ title: config.Lang.Embeds.QueueOver.Title, description: config.Lang.Embeds.QueueOver.Description, timestamp: new Date() }))
                if (config.AutoPlay.Enabled && config.AutoPlay.StartBackUp) setTimeout(function () { // UM
                    autoPlay(bot.guilds.cache.first(), false)
                }, 2500) // UM
            }
        })

        dispatcher.on('error', error => {
            console.log(errorPrefix + musicAddonPrefix + error)
        })
    }

    function checkError(error, channel, shutdown = false) {
        if (error.errors && error.errors.some(e => e.message == "API key not valid. Please pass a valid API key." || e.reason == 'keyInvalid')) {
            console.log(errorPrefix + musicAddonPrefix + "The set Youtube API key is incorrect. " + (shutdown ? "Shutting down..." : " "))
            channel.send(Embed({ preset: 'error', description: "The set Youtube API key is incorrect. " + (shutdown ? "Shutting down..." : " ") }))
            return shutdown ? process.exit() : false;
        } else {
            Utils.error(error.message, error.stack);
            return channel.send(Embed({
                preset: 'console'
            }))
        }
    }

    function checkInfo(song) {
        let missingInfo = false;
        let missingData = [];

        Object.values(song).forEach((value, i) => {
            if (typeof value == "object") {
                Object.values(value).forEach((v, index) => {
                    if (!v) {
                        missingInfo = true;
                        missingData.push(Object.keys(song)[i] + " - " + Object.keys(value)[index])
                    }
                })
            } else if (!value) {
                missingData.push(Object.keys(song)[i])
                missingInfo = true;
            }
        })

        if (JSON.stringify(missingData) == `["duration"]`) missingInfo = false;
        return missingInfo
    }

    function checkPerms(message, command) {
        let perms = true;
        let requiredRank = config.RequiredRanks[command];

        if (config && requiredRank !== false) {
            if (!Utils.hasPermission(message.member, requiredRank)) {
                perms = false;
                message.channel.send(Embed({ preset: 'nopermission' }));
            }

            return perms
        } else return perms;
    }

    function getType(search) {
        if (search.includes("youtube.com") && (search.includes('/playlist') || search.includes('&list='))) return 'playlist'
        else if ((search.includes("youtube.com") && search.includes('/watch') || search.includes("youtu.be"))) return 'video'
        else return 'search'
    }

    // UM
    function checkForDuplicates(video, message) {
        let server = servers.get(message.guild.id);

        if (config.PreventSongDuplicates && server) {
            if (server.songs.find(song => video.id == song.url.replace('https://www.youtube.com/watch?v=', ''))) {
                message.channel.send(Embed({
                    preset: 'error',
                    description: config.Lang.PreventSongDuplicates.AlreadyInQueue
                }))
                return true
            }
        } else {
            return false
        }
    } // UM

    function checkIfLive(video, message) {
        if (video.raw.snippet.liveBroadcastContent == "live") {
            message.channel.send(Embed({
                preset: 'error',
                description: "You cannot play livestreams"
            }))

            return true
        }

        return false
    }

    async function checkCommand(message, commandName) {
        let cont = true;
        let server = servers.get(message.guild.id);

        if (checkPerms(message, commandName) == false) {
            cont = false;
        }

        else if (commandName !== "play" && (!server || (server && (!server.connection || !server.songs.length || (server.connection && !server.connection.dispatcher))))) {
            cont = false;
            message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotPlayingMusic }));
        }

        else if (!message.member.voice.channel) {
            cont = false;
            message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotInVoiceChannel }));
        }

        return cont
    }

    // UM
    async function autoPlay(guild, firstStart = true) {
        autoPlaying = true;

        let server = new Server(undefined, guild)
        server.connection = await server.voiceChannel.join()
        if (firstStart) console.log(infoPrefix + musicAddonPrefix + 'Connected to voice channel')

        server.repeat = {
            mode: "queue",
            display: "Queue - " + config.Lang.AutoPlay.AutoPlay,
            broadcast: config.AutoPlay.AnnounceStartOrRestart
        }

        servers.set(guild.id, server)

        if (!server.textChannel || !server.voiceChannel) return console.log(errorPrefix + musicAddonPrefix + "The Auto Play voice and text channels could not be found.")
        if (config.AutoPlay.AnnounceStartOrRestart) server.textChannel.send(Embed({
            title: firstStart ? config.Lang.AutoPlay.Starting : config.Lang.AutoPlay.Restarting,
            timestamp: new Date()
        }))

        let playlist;
        let playlistVideos;

        try {
            playlist = await YT.getPlaylist(config.AutoPlay.Playlist);
            playlistVideos = await playlist.getVideos();
        } catch (e) {
            if (e.message && e.message.startsWith("No playlist ID found in URL:")) {
                console.log(errorPrefix + musicAddonPrefix + "The set auto play playlist is not a valid youtube playlist link");
                server.repeat = false;
                autoPlaying = false;
                return server.textChannel.send(Embed({ preset: 'error', description: config.Lang.AutoPlay.InvalidAutoplayPlaylist }))
            } else {
                return await checkError(e, server.textChannel, true);
            }
        }

        if (config.PreventSongDuplicates) {
            playlistVideos = playlistVideos.filter(video => {
                if (!server.songs.find(song => video.id == song.url.replace('https://www.youtube.com/watch?v=', ''))) return true
                else return false;
            })

            if ((await playlist.getVideos()).length !== playlistVideos.length) {

                if (playlistVideos.length == 0) {
                    return server.textChannel.send(Embed({
                        preset: 'error',
                        description: config.Lang.PreventSongDuplicates.PlaylistAlreadyInQueue
                    }))
                } else {
                    server.textChannel.send(Embed({
                        preset: 'error',
                        description: config.Lang.PreventSongDuplicates.PaylistSongsFiltered.replace(/{amount}/g, (await playlist.getVideos()).length - playlistVideos.length)
                    }))
                }
            }
        }

        await Utils.asyncForEach(playlistVideos, async video => {
            let song = new Song(video, config.Lang.AutoPlay.AutoPlay)
            let missingInfo = checkInfo(song)
            if (missingInfo) return server.textChannel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotAllInfoObtained }))
            server.songs.push(song)
        })

        savedQueue = new Array();
        savedQueue.push(...server.songs);

        await play(undefined, server.songs[0], guild)

        if (config.AutoPlay.NowPlayingMessages) server.textChannel.send(Embed({
            title: config.Lang.Embeds.NowPlaying.Title,
            fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: config.Lang.AutoPlay.AutoPlay, inline: true }],
            thumbnail: server.songs[0].image,
            timestamp: new Date()
        }));

        if (firstStart) console.log(infoPrefix + musicAddonPrefix + 'Auto play started')
    } // UM

    // PLAY
    CommandHandler.set({
        name: "play",
        run: async (bot, message, args) => {
            if (!await checkCommand(message, "play")) return;

            if (autoPlaying) { // UM
                autoPlaying = false;
                let server = servers.get(message.guild.id)
                if (!server) {
                    let ch = Utils.findChannel(config.AutoPlay.TextChannel, message.guild, 'text');
                    if (ch) ch.send(Embed({
                        preset: 'error',
                        description: config.Lang.AutoPlay.Stopping
                    }))
                } else {
                    await server.textChannel.send(Embed({
                        preset: 'error',
                        description: config.Lang.AutoPlay.Stopping
                    }))
                    server.voiceChannel.leave()
                    servers.delete(message.guild.id)
                }
            } // UM

            let server = servers.get(message.guild.id);
            if (!server) {
                server = new Server(message)
                servers.set(message.guild.id, server)
            }

            if (message.guild.me.voice.channel && message.guild.me.voice.channel.id !== message.member.voice.channel.id) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.AlreadyPlayingMusic }))
            if (!args.length && server.paused == true) {
                server.paused = false;
                server.connection.dispatcher.resume()
                return message.channel.send(Embed({ title: config.Lang.Embeds.Resume.Title, description: config.Lang.Embeds.Resume.Description.replace(/{song-name}/g, server.songs[0].title), thumbnail: server.songs[0].image, timestamp: new Date() }));
            }
            if (!args.length) return message.channel.send(Embed({ preset: 'invalidargs', usage: "play [song/playlist/search query]" }));

            if (!message.member.voice.channel.permissionsFor(bot.user).has('CONNECT') || !message.member.voice.channel.permissionsFor(bot.user).has('SPEAK')) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.InvalidPermissions }))

            let video;

            async function addSong(video, fromPlaylist = false) {
                return new Promise(async (resolve, reject) => {
                    let song = new Song(video, message.author.id)

                    let missingInfo = checkInfo(song)
                    if (missingInfo) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotAllInfoObtained }))
                    if (server.repeat && server.repeat.mode.toLowerCase() == "queue") savedQueue.push(song) // UM

                    if (server.songs.length < 1) {
                        server.songs.push(song);
                        try {
                            server.connection = await message.member.voice.channel.join();
                            play(message, server.songs[0]);
                            message.channel.send(Embed({
                                title: config.Lang.Embeds.NowPlaying.Title,
                                fields: [{ name: server.songs[0].author.name, value: server.songs[0].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                                thumbnail: server.songs[0].image,
                                timestamp: new Date()
                            }));
                            resolve()
                        } catch (e) {
                            console.log(errorPrefix + musicAddonPrefix + e)
                            servers.delete(message.guild.id);
                            message.channel.send(Embed({ preset: 'console' }));
                        }
                    } else {
                        server.songs.push(song);
                        if (!fromPlaylist) message.channel.send(Embed({
                            title: config.Lang.Embeds.AddedToQueue.Song,
                            fields: [{ name: server.songs[server.songs.length - 1].author.name, value: server.songs[server.songs.length - 1].title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                            thumbnail: server.songs[server.songs.length - 1].image,
                            timestamp: new Date()
                        }));
                        resolve()
                    }
                })
            }

            async function playlist() {
                return new Promise(async (resolve, reject) => {
                    try {
                        autoPlaying = false; // UM
                        await YT.getPlaylist(args.join(" ")).then(async playlist => {
                            let videos = await playlist.getVideos()

                            videos.filter(video => video.raw.snippet.liveBroadcastContent !== "live");

                            if (config.PreventSongDuplicates) { // UM
                                videos = videos.filter(video => {
                                    if (!server.songs.find(song => video.id == song.url.replace('https://www.youtube.com/watch?v=', ''))) return true
                                    else return false;
                                })
                                if ((await playlist.getVideos()).length !== videos.length) {
                                    if (videos.length == 0) {
                                        return message.channel.send(Embed({
                                            preset: 'error',
                                            description: config.Lang.PreventSongDuplicates.PlaylistAlreadyInQueue
                                        }))
                                    } else {
                                        message.channel.send(Embed({
                                            preset: 'error',
                                            description: config.Lang.PreventSongDuplicates.PlaylistSongsFiltered.replace(/{amount}/g, (await playlist.getVideos()).length - playlistVideos.length)
                                        }))
                                    }
                                }
                            } // UM

                            await Utils.asyncForEach(videos, async video => {
                                await addSong(video, fromPlaylist = true)
                            })

                            message.channel.send(Embed({
                                title: config.Lang.Embeds.AddedToQueue.Playlist,
                                fields: [{ name: playlist.channel.title, value: playlist.title, inline: true }, { name: config.Lang.Embeds.NowPlaying.RequestBy, value: '<@' + message.author.id + '>', inline: true }],
                                footer: config.Lang.Embeds.AddedToQueue.PlaylistLength.replace(/{amount}/g, videos.length),
                                thumbnail: playlist.thumbnails.medium.url,
                                timestamp: new Date()
                            }))
                            resolve()
                        })
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            async function song() {
                return new Promise(async (resolve, reject) => {
                    try {
                        autoPlaying = false; // UM
                        video = await YT.getVideo(args[0]);
                        if (checkIfLive(video, message) == true || checkForDuplicates(video, message) == true) return; // UM
                        await addSong(video);
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            async function search() {
                return new Promise(async (resolve, reject) => {
                    try {
                        autoPlaying = false; // UM
                        let topResults = await YT.searchVideos(args.join(' '), 10);
                        topResults = topResults.filter(result => result.raw.snippet.liveBroadcastContent !== "live");

                        if (topResults.length < 1) return message.channel.send(Embed({
                            preset: 'error',
                            description: config.Lang.Errors.NoSearchResults[0]
                        }))
                        if (topResults) {
                            if (config.PlayFirstResult) {
                                await addSong(await YT.getVideo("https://www.youtube.com/watch?v=" + topResults[0].id));
                                return resolve();
                            }

                            message.channel.send(Embed({
                                title: config.Lang.Embeds.Top10.Title,
                                description: config.Lang.Embeds.Top10.Description.replace(/{search}/g, args.join(" ")).replace(/{results}/g, topResults.map((result, i) => {
                                    return `**${i + 1}** | **${result.title}**\n> From __${result.channel.title}__`
                                }).join('\n\n'))
                            })).then(async msg => {
                                let emojisToVideos = {}

                                await topResults.forEach((video, i) => emojisToVideos[Utils.getEmoji(i + 1)] = video)

                                await Utils.waitForResponse(message.author.id, msg.channel).then(async response => {
                                    response.delete();

                                    if (!parseInt(response.content)) {
                                        msg.delete();
                                        message.delete();
                                        return;
                                    }

                                    let video = Object.values(emojisToVideos)[+response.content - 1]

                                    msg.delete();
                                    if (checkForDuplicates(video, message) == true) return; // UM
                                    await addSong(video);
                                    resolve();
                                })
                            })
                        } else {
                            reject('no results')
                        }
                    } catch (e) {
                        reject(e)
                    }
                })
            }

            let type = getType(args.join(" "));

            if (type == 'playlist') {
                await playlist()
                    .catch(async err => {
                        await song()
                            .catch(async err => {
                                await search()
                                    .catch(async err => {
                                        if (err == 'no results') return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NoSearchResults[1].replace(/{search}/g, args.join(" ")) }));
                                        await checkError(err, message.channel, false)
                                    })
                            })
                    })
            }

            else if (type == 'video') {
                await song()
                    .catch(async err => {
                        await search()
                            .catch(async err => {
                                if (err == 'no results') return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NoSearchResults[1].replace(/{search}/g, args.join(" ")) }));
                                await checkError(err, message.channel, false)
                            })
                    })
            }

            else if (type == 'search') {
                await search()
                    .catch(async err => {
                        if (err == 'no results') return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NoSearchResults[1].replace(/{search}/g, args.join(" ")) }));
                        await checkError(err, message.channel, false)
                    })
            }
        },
        description: "Play a song",
        usage: "play [song/playist/search query]",
        aliases: [],
        type: "music"
    })

    // QUEUE
    CommandHandler.set({
        name: 'queue',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "queue")) return;

            let page = +args[0] || 1;
            let pages = []

            await server.songs.forEach(async (song, i) => {
                let str = "";

                if (i == 0) {
                    str += config.Lang.Embeds.Queue.CurrentlyPlaying.replace(/{song-name}/g, song.title).replace(/{song-url}/g, song.url)
                }

                str += '[**' + (i + 1) + '**] ' + `[${song.title}](${song.url})\n`

                if (i % 15 == 0) {
                    pages.push(str)
                } else {
                    if (!pages[0]) pages[0] = str
                    else pages[pages.length - 1] += str
                }

            })

            if (pages.length < page || page < 1) return message.channel.send(Embed({ preset: "error", description: config.Lang.Errors.InvalidPageNumber }));

            message.channel.send(Embed({
                title: config.Lang.Embeds.Queue.Title.replace(/{page}/g, page),
                description: config.Lang.Embeds.Queue.Description.replace(/{queue}/g, pages[page - 1]).replace(/{mode}/g, server.repeat ? server.repeat.display : "Off").replace(/{extra}/g, server.repeat ? (server.repeat.mode == "song" ? config.Lang.Embeds.Queue.ExtraInfo_Song : config.Lang.Embeds.Queue.ExtraInfo_Queue) : ""), // UM
                timestamp: new Date(),
                thumbnail: server.songs[0].image
            })).then(async msg => {
                if (pages.length > 1) {
                    queueEmbeds.set(msg.id, {
                        pages: pages,
                        page: page
                    })

                    await msg.react("◀️");
                    msg.react("▶️");
                }
            })
        },
        description: config.Lang.CommandDescriptions.queue,
        usage: 'queue',
        aliases: ['musicqueue'],
        type: 'music'
    })

    // PAUSE
    CommandHandler.set({
        name: 'pause',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "pause")) return;

            server.paused = true;
            server.connection.dispatcher.pause();
            message.channel.send(Embed({ color: '#fca103', title: config.Lang.Embeds.Pause.Title, description: config.Lang.Embeds.Pause.Description.replace(/{song-name}/g, server.songs[0].title), thumbnail: server.songs[0].image, timestamp: new Date() }));
        },
        description: config.Lang.CommandDescriptions.pause,
        usage: 'pause',
        aliases: [],
        type: 'music'
    })

    // RESUME
    CommandHandler.set({
        name: 'resume',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "resume")) return;
            if (!server.paused) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotPaused }));

            server.paused = false;
            server.connection.dispatcher.resume();
            message.channel.send(Embed({ title: config.Lang.Embeds.Resume.Title, description: config.Lang.Embeds.Resume.Description.replace(/{song-name}/g, server.songs[0].title), thumbnail: server.songs[0].image, timestamp: new Date() }));
        },
        description: config.Lang.CommandDescriptions.resume,
        usage: 'resume',
        aliases: [],
        type: 'music'
    })

    // SKIP
    CommandHandler.set({
        name: 'skip',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "skip")) return;
            if (server.songs.length == 1 && !server.repeat) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.CantSkip })); // UM

            message.channel.send(Embed({ title: config.Lang.Embeds.Skip.Title }));
            server.connection.dispatcher.emit('finish');
        },
        description: config.Lang.CommandDescriptions.skip,
        usage: 'skip',
        aliases: ['next'],
        type: 'music'
    })

    // STOP
    CommandHandler.set({
        name: 'stop',
        run: async (bot, message, args, { prefixUsed, commandUsed }) => {
            let server = servers.get(message.guild.id);

            if (commandUsed == "leave" && !server) {
                if (message.member.voice.channel && message.guild.me.voice.channel && message.member.voice.channelID == message.guild.me.voice.channelID) {
                    await message.member.voice.channel.leave();
                    return message.channel.send(Embed({ title: config.Lang.Embeds.Leave.Title, timestamp: new Date() }))
                }
            }

            if (!await checkCommand(message, "stop")) return;
            if (autoPlaying) autoPlaying = false; // UM

            Utils.addStatusPlaceholder(/{current-song-name}/g, "Nothing");
            Utils.addStatusPlaceholder(/{current-song-artist}/g, "Nobody");

            server.connection.dispatcher ? server.connection.dispatcher.destroy() : "";
            message.member.voice.channel.leave();
            servers.delete(message.guild.id)
            message.channel.send(Embed({ title: config.Lang.Embeds.StoppedMusic.Title, description: config.Lang.Embeds.StoppedMusic.Description, timestamp: new Date() }))

            // UM
            if (config.AutoPlay.Enabled && config.AutoPlay.StartBackUp) setTimeout(function () {
                autoPlay(bot.guilds.cache.first(), false)
            }, 2500)
        },
        description: config.Lang.CommandDescriptions.stop,
        usage: 'stop',
        aliases: [
            'stopmusic',
            'end',
            'endsong',
            'leave'
        ],
        type: 'music'
    })

    // JOIN
    CommandHandler.set({
        name: 'join',
        run: async (bot, message, args) => {
            if (!checkPerms(message, "join")) return
            else if (!message.member.voice.channel) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotInVoiceChannel }));
            else if (message.guild.me.voice.channel) return message.channel.send(Embed({ preset: "error", description: config.Lang.Errors.AlreadyPlayingMusic }))

            await message.member.voice.channel.join()
            message.channel.send(Embed({ title: config.Lang.Embeds.Join.Title, timestamp: new Date() }))
        },
        description: config.Lang.CommandDescriptions.join,
        usage: 'join',
        aliases: [],
        type: 'music'
    })

    // UM

    // VOLUME
    CommandHandler.set({
        name: 'volume',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "volume")) return;
            if (!args.length) return message.channel.send(Embed({ title: config.Lang.Embeds.CurrentVolume.Title, description: config.Lang.Embeds.CurrentVolume.Description.replace(/{volume}/g, "" + server.volume + "/10") }));
            if (isNaN(args[0])) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.InvalidVolumeInt }));

            const volume = parseInt(args[0]);
            if (volume < 0 || volume > 10) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.InvalidVolumeInt }));
            server.volume = volume;
            server.connection.dispatcher.setVolumeLogarithmic(volume / 5);
            message.channel.send(Embed({ title: config.Lang.Embeds.VolumeSet.Title, description: config.Lang.Embeds.VolumeSet.Description.replace(/{volume}/g, "" + volume + '/10') }));
        },
        description: config.Lang.CommandDescriptions.volume,
        usage: 'volume <0-10>',
        aliases: [],
        type: 'music'
    })

    // NOW PLAYING
    CommandHandler.set({
        name: 'nowplaying',
        run: async (bot, message, args) => {
            if (!await checkCommand(message, "nowplaying")) return;

            const server = servers.get(message.guild.id);
            const song = server.songs[0];
            const timePlayed = server.connection.dispatcher.streamTime;
            const format = unit => unit.toString().length > 1 ? unit.toString() : `0${unit}`;

            let secs = timePlayed / 1000
            const days = ~~(secs / 86400);
            secs -= days * 86400;
            const hours = ~~(secs / 3600);
            secs -= hours * 3600;
            const minutes = ~~(secs / 60);
            secs -= minutes * 60;
            let total = [];

            if (days > 0) total.push(~~days);
            if (hours > 0) total.push(~~hours);
            if (minutes >= 0) total.push(~~minutes);
            if (secs >= 0) total.push(~~secs);

            const time = total.map(unit => format(unit)).filter(unit => unit).join(":");

            if (!song.duration) await song.getDuration();

            message.channel.send(Embed({
                title: config.Lang.Embeds.CurrentlyPlaying.Title,
                thumbnail: song.image,
                fields: [
                    {
                        name: config.Lang.Embeds.CurrentlyPlaying.Fields[0],
                        value: song.title
                    },
                    {
                        name: config.Lang.Embeds.CurrentlyPlaying.Fields[1],
                        value: `[${song.author.name}](${song.author.link})`
                    },
                    {
                        name: config.Lang.Embeds.CurrentlyPlaying.Fields[3],
                        value: song.requestedBy == config.Lang.AutoPlay.AutoPlay ? config.Lang.AutoPlay.AutoPlay : "<@" + song.requestedBy + ">"
                    }, {
                        name: "Duration",
                        value: `${time} - ${song.duration}`
                    }
                ]
            }))
        },
        description: config.Lang.CommandDescriptions.nowplaying,
        usage: 'nowplaying',
        aliases: [
            'np',
            'playingnow',
            'playing'
        ],
        type: 'music'
    })

    // SKIPTO
    CommandHandler.set({
        name: 'skipto',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "skipto")) return;
            if (!args.length || !parseInt(args[0])) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'skipto <queue position>' }));
            if (parseInt(args[0]) < 1 || parseInt(args[0]) > server.songs.length) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.InvalidSkiptoPositon }))
            if ([0, 1, 2].includes(parseInt(args[0]))) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.CantSkiptoPosition }))

            server.songs = server.songs.slice((parseInt(args[0]) - 2));
            server.connection.dispatcher.emit('finish');
            message.channel.send(Embed({ title: config.Lang.Embeds.Skipto.Title, description: config.Lang.Embeds.Skipto.Description.replace(/{position}/g, args[0]), timestamp: new Date() }))
        },
        description: config.Lang.CommandDescriptions.skipto,
        usage: 'skipto <queue position>',
        aliases: [],
        type: 'music'
    })

    // REMOVE
    CommandHandler.set({
        name: 'removesong',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "removesong")) return;
            if (!args[0] || !parseInt(args[0])) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'removesong <queue position>' }));
            if (server.songs.length == 1 || [0, 1].includes(parseInt(args[0]))) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.CantRemoveFirstSong }))

            server.songs.splice(parseInt(args[0]) - 1, 1)
            message.channel.send(Embed({ title: config.Lang.Embeds.Remove.Title, description: config.Lang.Embeds.Remove.Description.replace(/{position}/g, args[0]), timestamp: new Date() }))
        },
        description: config.Lang.CommandDescriptions.removesong,
        usage: 'removesong <queue position>',
        aliases: ['removesong'],
        type: 'music'
    })

    // LYRICS
    CommandHandler.set({
        name: 'lyrics',
        run: async (bot, message, args) => {
            if (checkPerms(message, "lyrics") == false) return;
            if (args.length < 1) return message.channel.send(Embed({ preset: 'invalidargs', usage: "lyrics <song name>" }));
            let search = encodeURIComponent(args.join(" "))

            request({
                uri: `https://api.corebot.dev/api/v1/client/music/lyrics_testing?key=${Utils.variables.config.Key}&search=${search}`,
                method: 'POST',
                json: true
            }).then(async res => {
                if (res.error) {
                    return message.channel.send(Embed({
                        preset: 'error',
                        description: config.Lang.Errors.CouldntGetSongLyrics
                    }))
                } else {
                    const cheerio = require('cheerio');

                    let scrapeLyrics = (url) => {
                        return new Promise((resolve, reject) => {
                            request(url)
                                .then((html) => {
                                    const $ = cheerio.load(html);
                                    const lyricsTag = $('.lyrics > p');

                                    const lyrics = [];

                                    lyricsTag[0]
                                        .children
                                        .filter(c => c.data || c.tagName == "a")
                                        .forEach(child => {
                                            if (child.tagName == "a") {
                                                return child
                                                    .children
                                                    .filter(c => c.data)
                                                    .forEach(c => lyrics.push(c.data));
                                            } else lyrics.push(child.data);
                                        });

                                    resolve(lyrics);
                                })
                                .catch(err => {
                                    reject({ message: err, show: false })
                                })
                        })
                    };

                    scrapeLyrics(res.url)
                        .then(lyrics => {
                            message.channel.send(Embed({
                                title: config.Lang.Embeds.Lyrics.Title.replace(/{song-name}/g, res.title),
                                url: res.url,
                                thumbnail: res.image,
                                description: config.Lang.Embeds.Lyrics.Description.replace(/{artist}/g, res.artist).replace(/{lyrics}/g, lyrics.join(" "))
                            }))
                        })
                        .catch(err => {
                            Utils.error(err)
                            return message.channel.send(Embed({
                                preset: 'error',
                                description: config.Lang.Errors.CouldntGetSongLyrics
                            }))
                        });
                }
            })
        },
        description: config.Lang.CommandDescriptions.lyrics,
        usage: 'lyrics <song name>',
        aliases: ['songlyrics'],
        type: 'music'
    })

    // SHUFFLE
    CommandHandler.set({
        name: 'shuffle',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "shuffle")) return;

            let songs = server.songs;
            let length = songs.length - 1;
            let newSongs = [];

            if (songs.length < 3) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotEnoughSongsToShuffle }))

            newSongs.push(server.songs[0])
            songs.shift();

            for (let i = 0; i < length; i++) {
                let randomInt = Math.floor(Math.random() * songs.length)
                let song = songs[randomInt];
                newSongs.push(song);
                songs.splice(randomInt, 1);
            }

            server.songs = newSongs;
            let list = "";

            for (let i = 0; i <= (length > 20 ? 19 : length); i++) {
                let song = server.songs[i]
                list += '[**' + (i + 1) + '**] ' + `[${song.title}](${song.url})` + '\n'
            }

            if (server.songs.length > 20) list += "and more..."
            message.channel.send(Embed({
                title: config.Lang.Embeds.Shuffle.Title,
                description: config.Lang.Embeds.Shuffle.Description.replace(/{shuffledqueue}/g, list)
            }))
        },
        description: config.Lang.CommandDescriptions.shuffle,
        usage: 'shuffle',
        aliases: [],
        type: 'music'
    })

    // REPEAT
    CommandHandler.set({
        name: 'repeat',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "repeat")) return;
            if (!args.length) return message.channel.send(Embed({ preset: 'invalidargs', usage: 'repeat <song/queue/off>' }));

            let type = args[0].toLowerCase()
            let extra = "";

            if (type == "off" && !server.repeat) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.NotInRepeat }));
            if (server.repeat && server.repeat.mode.toLowerCase().startsWith(type)) return message.channel.send(Embed({ preset: 'error', description: config.Lang.Errors.AlreadyInRepeat }))
            if (type == 'song') {
                server.repeat = {
                    mode: "song",
                    display: "Song",
                    broadcast: true
                }
                extra += config.Lang.Embeds.Repeat.ExtraInfo_Song
            } else if (type == 'queue') {
                server.repeat = {
                    mode: "queue",
                    display: "Queue",
                    broadcast: true
                }
                savedQueue = server.songs;
                extra += config.Lang.Embeds.Repeat.ExtraInfo_Queue
            } else if (type == 'off') {
                if (autoPlaying) autoPlaying = false;
                server.repeat = false;
            } else {
                return message.channel.send(Embed({
                    preset: 'invalidargs',
                    usage: 'repeat <song/queue/off>'
                }))
            }

            message.channel.send(Embed({
                title: config.Lang.Embeds.Repeat.Title,
                description: config.Lang.Embeds.Repeat.Description.replace(/{type}/g, type).replace(/{extra}/g, extra)
            }))
        },
        description: config.Lang.CommandDescriptions.repeat,
        usage: 'repeat <song/queue/off>',
        aliases: [],
        type: 'music'
    })

    // VOTESKIP
    CommandHandler.set({
        name: 'voteskip',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "voteskip")) return;
            if (!config.VoteSkip.TimeLimit || !parseInt(config.VoteSkip.TimeLimit)) {
                message.channel.send(Embed({ preset: 'console' }));
                return console.log(errorPrefix + musicAddonPrefix + "The UM Config -> VoteSkip -> TimeLimit setting must be an integer!");
            }

            let msg = await message.channel.send(Embed({
                title: config.Lang.Embeds.Voteskip.Title,
                description: config.Lang.Embeds.Voteskip.Description.replace(/{timeleft}/g, config.VoteSkip.TimeLimit)
            }))

            if (config.VoteSkip.Ping) message.channel.send(message.guild.me.voice.channel.members.filter(m => !m.user.bot).map(m => m.toString()).join(" "))
                .then(m => { m.delete({ timeout: 3000 }) })
                .catch(err => { });

            await msg.react("✅");
            await msg.react("❌");

            let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && message.guild.me.voice.channel.members.filter(m => !m.user.bot).map(m => m.id).includes(user.id);
            let collector = msg.createReactionCollector(filter, { max: message.guild.me.voice.channel.members.length - 1, time: config.VoteSkip.TimeLimit * 1000 })

            let timeLeft = config.VoteSkip.TimeLimit - 5;
            let timeUpdater = setInterval(function () {
                msg.edit(Embed({
                    title: config.Lang.Embeds.Voteskip.Title,
                    description: config.Lang.Embeds.Voteskip.Description.replace(/{timeleft}/g, timeLeft)
                }))
                timeLeft -= 5;

                if (timeLeft == 0) {
                    msg.edit(Embed({
                        title: config.Lang.Embeds.Voteskip.Title,
                        description: config.Lang.Embeds.Voteskip.Description.replace(/{timeleft}/g, timeLeft)
                    }))
                    clearInterval(timeUpdater)
                }
            }, 5 * 1000)


            collector.on('end', collected => {
                msg.delete();
                let checks = collected.array().filter(reaction => reaction.emoji.name == "✅")[0];
                let xs = collected.array().filter(reaction => reaction.emoji.name == "❌")[0];
                checks = !!checks ? checks : 0
                xs = !!xs ? xs : 0
                if (checks.count > xs.count) {
                    message.channel.send(Embed({
                        color: Utils.variables.config.EmbedColors.Success,
                        title: config.Lang.Embeds.Voteskip_Skipped.Title,
                        description: config.Lang.Embeds.Voteskip_Skipped.Description
                    }))
                    server.connection.dispatcher.emit('finish');
                } else {
                    message.channel.send(Embed({
                        color: Utils.variables.config.EmbedColors.Error,
                        title: config.Lang.Embeds.Voteskip_NotSkipped.Title,
                        description: config.Lang.Embeds.Voteskip_NotSkipped.Description
                    }))
                }
            })
        },
        description: config.Lang.CommandDescriptions.voteskip,
        usage: 'voteskip <song position>',
        aliases: [],
        type: 'music'
    })

    // RESTART
    CommandHandler.set({
        name: 'restart',
        run: async (bot, message, args) => {
            let server = servers.get(message.guild.id);
            if (!await checkCommand(message, "restart")) return;

            message.channel.send(Embed({
                title: config.Lang.Embeds.Restart.Title,
                description: config.Lang.Embeds.Restart.Description
            }))

            server.repeat = {
                mode: "song",
                display: "Song",
                broadcase: true,
            };
            await server.connection.dispatcher.emit("finish");
            server.repeat = false;
        },
        description: config.Lang.CommandDescriptions.restart,
        usage: 'restart',
        aliases: ['restartsong'],
        type: 'music'
    })
    // UM

    EventHandler.set('voiceStateUpdate', (bot, oldState, newState) => {
        if (oldState.channel && !newState.channel) {
            let server = servers.get(oldState.channel.guild.id);

            if (server) {
                if (!autoPlaying) { //UM
                    let members = oldState.channel.members;
                    if (members.size == 1 && members.get(bot.user.id)) {
                        server.voiceChannel.leave()
                        server.textChannel.send(Embed({ title: config.Lang.Embeds.QueueOver.Title, description: config.Lang.Embeds.QueueOver.Description, timestamp: new Date() }))
                        servers.delete(oldState.channel.guild.id)
                        // UM
                        if (config.AutoPlay.Enabled) setTimeout(function () {
                            autoPlay(bot.guilds.cache.first(), false)
                        }, 2500)
                        // UM
                    }
                } // UM
            }
        }
    })

    EventHandler.set('raw', async (bot, event) => {
        if (event.t !== "MESSAGE_REACTION_ADD") return;

        const { d: data } = event;
        const user = bot.users.cache.get(data.user_id)

        if (user.bot) return;

        const emoji = (data.emoji.id) ? data.emoji.id : data.emoji.name;

        if (!["◀️", "▶️"].includes(emoji)) return;

        const channel = bot.channels.cache.get(data.channel_id);
        const message = await channel.messages.fetch(data.message_id);
        const server = servers.get(channel.guild.id);
        const queue = queueEmbeds.get(message.id);

        if (queue && server) {
            if (emoji == "▶️" && queue.pages.length > queue.page) {
                queue.page++;

                await message.edit(Embed({
                    title: config.Lang.Embeds.Queue.Title.replace(/{page}/g, queue.page),
                    description: config.Lang.Embeds.Queue.Description.replace(/{queue}/g, queue.pages[queue.page - 1]).replace(/{mode}/g, server.repeat ? server.repeat.display : "Off").replace(/{extra}/g, server.repeat ? (server.repeat.mode == "song" ? config.Lang.Embeds.Queue.ExtraInfo_Song : config.Lang.Embeds.Queue.ExtraInfo_Queue) : ""), // UM
                    timestamp: new Date(),
                    thumbnail: server.songs[0].image
                }))
            } else if (emoji == "◀️" && 1 <= queue.page - 1) {
                queue.page--;

                await message.edit(Embed({
                    title: config.Lang.Embeds.Queue.Title.replace(/{page}/g, queue.page),
                    description: config.Lang.Embeds.Queue.Description.replace(/{queue}/g, queue.pages[queue.page - 1]).replace(/{mode}/g, server.repeat ? server.repeat.display : "Off").replace(/{extra}/g, server.repeat ? (server.repeat.mode == "song" ? config.Lang.Embeds.Queue.ExtraInfo_Song : config.Lang.Embeds.Queue.ExtraInfo_Queue) : ""), // UM
                    timestamp: new Date(),
                    thumbnail: server.songs[0].image
                }))
            }

            message.reactions.cache.get(emoji).users.remove(user);
        }
    })

    console.log(infoPrefix + musicAddonPrefix + "Addon loaded")

    if (config.AutoPlay.Enabled) { // UM
        console.log(infoPrefix + musicAddonPrefix + 'Starting auto play...')
        autoPlay(bot.guilds.cache.first());
    } // UM
}