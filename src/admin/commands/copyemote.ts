import { Message, Permissions } from 'discord.js';
import { bot } from '../../bot';
import { log, makeError } from '../../utils';

bot.registerCommand('copyemote', ['emote', 'addemote'], async message => {
    const [emote] = bot.parseCommand(message, /(.*)/);

    await bot.startTyping(message.channel);

    if (!(message instanceof Message) || !message.guild) {
        return;
    }

    const member = await message.guild.members.fetch(message.author.id)

    if (!member.permissions.has(Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS)) {
        bot.replyTo(message, bot.COLORS.ERROR, makeError("Sorry, but you don't have permission to do that"));
        return;
    }

    let url = '';
    let name = '';
    let targetMsg = message;

    // Allow the copyemote command to be used by passing in an attachment or emoji from another server, or by replying
    // to a message that is an attachment or emoji from another server (common use case is for someone to post a cool emoji
    // in chat and we want to steal it for ourselves).
    if (message.type === 'REPLY') {
        targetMsg = await message.fetchReference();
    }

    if (targetMsg.attachments.size > 0) {
        // If the message has an attachment, get the name from the command or attachment filename (e.g. `!copyemote rooPing` will
        // use rooPing as the name). URL is just the attachment CDN url
        url = targetMsg.attachments.first()?.url || '';
        name = emote.trim() || targetMsg.attachments.first()?.name?.replace(/\.[a-z0-9]+$/i, '') || 'untitled';
    } else {
        // Command was called against an emoji so we get the emoji ID and name (emoji syntax is like <:name:long_id_string>)
        let emoji = message.type === 'REPLY' ? targetMsg.content : emote;
        let m = emoji.match(/<(a?):([^:]+):([0-9]+)>/i);

        // Message didn't contain an emoji to copy
        if (!m && emoji.match(/https:\/\/cdn\.discordapp\.com\/emojis/i)) {
            // This is how to generate a URL for an emoji
            url = emoji.match(/(https:\/\/cdn\.discordapp\.com\/emojis\/[0-9]+\.[a-z]+)/i)[1] + '?size=4096&quality=lossless';
            url = url.replace('.webp', '.png');
            name = emoji.split(' ')[1];

            if (!name) {
                bot.replyTo(message, bot.COLORS.ERROR, makeError("Please specify an emoji name when using a URL"));
                return;
            }
        } else if (!m) {
            bot.replyTo(message, bot.COLORS.ERROR, makeError("No emoji detected"));
            return;
        } else {
            // This is how to generate a URL for an emoji
            url = `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] === 'a' ? 'gif' : 'png'}?size=4096&quality=lossless`;
            name = m[2];

            emoji = emote.replace(/<a?:([^:])+:([0-9])+>/i, '').trim();
    
            if (emoji.length > 0) {
                name = emoji;
            }
        }
    }
    
    try {
        log('debug', `Attempting to add new emote (url: ${url}, name: ${name})`);
        const newEmoji = await message.guild.emojis.create(url, name.replace(/:/g, ''));
        log('info', `${message.author.tag} has added a new emote (${url}, name: ${newEmoji.name}, id: ${newEmoji.id})`);

        // Need a slight timeout after adding the emote or it won't load in the resulting message
        setTimeout(() => {
            bot.replyTo(message, bot.COLORS.SUCCESS, `Your new emote has been added <${url.includes('.gif') ? 'a' : ''}:${newEmoji.name}:${newEmoji.id}> as :${newEmoji.name}:`);
        }, 100);
    } catch (err) {
        // Typical failures is only if we're out of emoji slots, or the attachment is too big
        bot.replyTo(message, bot.COLORS.ERROR, makeError("Failed to create emoji. I'm sorry <:sadge:1069981541918331031>\n\n> " + err.toString().split("\n").join("\n> ")));
    }
});
