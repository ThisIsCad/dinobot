import { Message, MessageEmbed } from 'discord.js';
import { bot } from '../bot';
import { EMBED_ERROR_COLOR, EMBED_INFO_COLOR, log, loadPersistentData, savePersistentData, makeError } from "../utils";

interface CannedReply {
    url?: string; 
    value: string; 
    locked: boolean; 
    author: string;
}

export const cannedReplies = loadPersistentData('cannedreplies', {}) as { [guildId: string]: { [name: string]: CannedReply } };

/**
 * Only load images/embeds from trusted domains for security reasons. Don't want spammers to
 * abuse this feature.
 */
const WHITELISTED_DOMAINS = [
    'https://media.tenor.com/',
    'https://cdn.discordapp.com/',
    'https://media.discordapp.net/',
    'https://images-ext-1.discordapp.net/',
    'https://images-ext-2.discordapp.net/',
    'https://images-ext-3.discordapp.net/',
    'https://images-ext-4.discordapp.net/',
    'https://images-ext-5.discordapp.net/',
    'https://tenor.com/',
    'https://c.tenor.com/',
];

/**
 * Don't use an embed if a canned reply matches any of the regular expressions here. Generally the
 * Embed we use can only render static images, so gifs and videos shouldn't use an embed. This list
 * only gets checked if the url already matches WHITELISTED_DOMAINS, so it should be safe to just 
 * use a "naked" message, which Discord will handle appropriately (e.g. embedding the video).
 */
const NO_EMBED_WHITELIST = [
    /\.mp4$/i,
    /https:\/\/tenor\.com\//i,
];

const OPS_ROTATION = [
    'KP/Ravagers/Gods',
    'DF/DP/SnV or Dxun',
    'EV/EC/TFB',
    'SNV/ToS/Dxun',
];

function getWeeks(endDate: Date) {
    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    const startDate = new Date('2022-01-01');
  
    return Math.floor(Math.abs(endDate.getTime() - startDate.getTime()) / msInWeek);
}
  
export function saveCannedReplies() {
    savePersistentData('cannedreplies', cannedReplies);
}

/**
 * Return a MessageEmbed or text reply for the contents of the Canned Message. If the message contains
 * a URL, it will be embedded correct and can be used with sendReply.
 * 
 * @param reply The canned reply
 * @returns MessageEmbed | string
 */
export function renderCannedReply(reply: CannedReply) {
    let match;

    if (!reply) {
        return new MessageEmbed()
            .setTitle('Well, this is embarassing')
            .setDescription('<a:confusedPsyduck:861432384318996510> Hmmm, for some reason, there is nothing here (probably a broken alias).');
    } else if (reply.url && NO_EMBED_WHITELIST.some(x => reply.url?.match(x))) {
        return 'noembed:' + reply.url;
    } else if (reply.url) {
        return new MessageEmbed().setDescription(reply.value || '').setImage(reply.url);
    } else if (match = reply.value.trim().match(/^<:[^:]+?:([0-9]+)>$/)) {
        return new MessageEmbed().setImage(`https://cdn.discordapp.com/emojis/${match[1]}.png?size=96&quality=lossless`);
    } else if (match = reply.value.trim().match(/^<a:[^:]+?:([0-9]+)>$/)) {
        return new MessageEmbed().setImage(`https://cdn.discordapp.com/emojis/${match[1]}.gif?size=96&quality=lossless`);
    } else {
        return new MessageEmbed().setDescription(reply.value || '⠀');
    }
}

export function cannedReplyHandler(message: Message<boolean>) {
    if (!message.content.startsWith('=') || !message.guildId) {
        return;
    } else if (!cannedReplies.hasOwnProperty(message.guildId)) {
        cannedReplies[message.guildId] = { '__auto_update__': { author: 'DinoBot', locked: true, value: '' } };
    }

    let content = message.content.substring(1);
    let name = content.split('=')[0].toLowerCase().replace(/(\\|^\?)/g, '').trim();
    let reply = cannedReplies[message.guildId][name];
    
    // Not an assignment, and no existing reply was found
    if (!content.includes('=') && !reply) {
        if (name.includes(' ')) {
            // Try searching without spaces, e.g. if they searched "pyro rotation", search "pyrorotation"
            reply = cannedReplies[message.guildId][name.replaceAll(' ', '')];
        } else {
            // Remove spaces from saved replies
            let actualName = Object.keys(cannedReplies[message.guildId]).find(x => x.replaceAll(' ', '') === name) || name;
            reply = cannedReplies[message.guildId][actualName];
        }   
    }

    // Assign a message
    if (content.includes('=')) {
        if (name === '' || name.includes('=') || name.includes('@') || name.startsWith('?')) {
            bot.replyTo(message, EMBED_ERROR_COLOR, 'Invalid canned reply name. Names must not be blank or contain the prefix character (=), alias character (@), source character(?), or Discord escape character.');
            return;
        } else if (reply?.locked && !bot.checkPermissions('crlock', message.channel)) {
            bot.replyTo(message, EMBED_ERROR_COLOR, 'This canned reply is locked and can only be edited in command channels');
            return;
        }

        let value = content.substring(name.length).trim().substring(1).trim().replace(/(^"|"$)/g, '');

        // Prohibit users from trying to assign a value to a reserved name (e.g. =help)
        if (name.match(/^(search|find|help)\b/i) || name.startsWith('__')) {
            bot.replyTo(message, EMBED_ERROR_COLOR, 'Invalid canned reply name, that name is reserved for system use');
            return;
        } else if (name.match(/^p[o0][o0]pd[0o]gs?$/i)) {
            message.react('<:no:740146335197691945>');
            return;
        }

        // If the assign syntax is used with no attachments or content, it's a delete operation. E.g.
        // 
        //   =foo=
        //
        // This will delete the canned reply "foo"
        if (value === '' && message.attachments.size === 0) {
            delete cannedReplies[message.guildId][name];
            message.react('👍');
            log('info', `Deleting canned reply for ${message.author.tag}: ${name}`);
            saveCannedReplies();
            return;
        }

        // If the value starts with an '@', we are creating an alias
        if (value.startsWith('@')) {
            // Check if the target of the alias exists
            if (!cannedReplies[message.guildId].hasOwnProperty(value.substring(1))) {
                bot.replyTo(message, EMBED_ERROR_COLOR, makeError(`Unable to assign alias, there was no canned reply with the name "${value.substring(1)}"`));
                return;
            } 

            // Check if the target is already an alias
            if (cannedReplies[message.guildId][value.substring(1)].value.startsWith('@')) {
                bot.replyTo(message, EMBED_ERROR_COLOR, makeError(`Unable to assign alias, =${value.substring(1)} is also an alias of =${cannedReplies[message.guildId][value.substring(1)].value.substring(1)}`));
                return;
            }

            cannedReplies[message.guildId][name] = { locked: reply?.locked || false, value, author: message.author.tag };
            message.react('👍');
            log('info', `New canned reply added by ${message.author.tag}: ${name}`);
            saveCannedReplies();
            return;
        } 

        let target = name;

        if (cannedReplies[message.guildId][name] && cannedReplies[message.guildId][name].value.startsWith('@') && !value.startsWith('@')) {
            target = cannedReplies[message.guildId][name].value.substring(1);
            bot.replyTo(message, EMBED_INFO_COLOR, `=${name} is an alias for =${target}, updating =${target}. To unassign an alias, please delete it first (using a blank value, such as this: \`=name=\`)`);
        } 

        if (message.attachments.size > 0) {
            cannedReplies[message.guildId][target] = { locked: reply?.locked || false, value, url: message.attachments.first()?.url, author: message.author.tag };
        } else if (WHITELISTED_DOMAINS.some(x => value.startsWith(x))) {
            cannedReplies[message.guildId][target] = { locked: reply?.locked || false, value: '', url: value.split(' ')[0], author: message.author.tag };
        } else {
            cannedReplies[message.guildId][target] = { locked: reply?.locked || false, value, author: message.author.tag };
        }

        message.react('👍');
        log('info', `New canned reply added by ${message.author.tag}: ${target}`);
        saveCannedReplies();
    } else if (name.match(/^(search|find) /i)) {
        bot.execCommand('crlist', message);
    } else if (name === 'help' || !name) {
        bot.replyTo(message, EMBED_INFO_COLOR, new MessageEmbed().setTitle('Canned Replies').setDescription(
            'Canned replies are a feature that allow you to save a message/attachment/link with a name, and then ' +
            'whenever that name is posted in a channel with DinoBot, the contents will be posted as a reply. For ' +
            'example, you could create a command that contains your guild\'s StarParse info:\n\n' +
            '```\n=parse=**StarParse Group:** DinoBot/DinoBot\n```\n' + 
            'Then, anytime a user needs the parse or asks for it, instead of trying to dig thru your pinned messages to ' + 
            'find it, you can simply use the `=parse` command and DinoBot will post your saved messages.\n\n' + 
            'Canned replies are meant to be a collaborative feature, so anyone can create, edit, or use them. If you want to ' +
            'lock down a certain reply, admins can use the `!crlock` and `!crunlock` commands.\n\n' +
            'If you are trying to find a canned reply but cannot remember the exact name, you can use the `=search` command to ' + 
            'find partial matches. For example: `=search guide` will return any canned replies with "guide" in the name.' 
        ));
    } else if (reply && content.startsWith('?')) {
        bot.replyTo(message, EMBED_INFO_COLOR, '```\n' + reply.value.replace(/^```/, '\\`\\`\\`') + '\n```');
    } else if (reply && content === 'ops') {
        let cannedReply = reply.value.startsWith('@') ? cannedReplies[message.guildId][reply.value.substring(1)] : reply;
        let weeks = getWeeks(new Date());
        let op = OPS_ROTATION[weeks % 4];
        let nextOp = OPS_ROTATION[(weeks + 1) % 4];
        cannedReply.value = `This week's op is: **${op}**\nNext week's op is: *${nextOp}*`;

        bot.replyTo(message, EMBED_INFO_COLOR, renderCannedReply(cannedReply));
    } else if (reply) { 
        let cannedReply = renderCannedReply(reply.value.startsWith('@') ? cannedReplies[message.guildId][reply.value.substring(1)] : reply);

        if (name.includes('rotation') && cannedReply instanceof MessageEmbed) {
            cannedReply = cannedReply.setFooter({ text: `${name} | Use =rotation to select a different rotation guide`});
        } else if (name.includes('tree') && cannedReply instanceof MessageEmbed) {
            cannedReply = cannedReply.setFooter({ text: `${name} | Use =tree to select a different passive tree`});
        }

        bot.replyTo(message, EMBED_INFO_COLOR, cannedReply);
    } else if (name.includes('rotation') || name.includes('tree')) {
        bot.execCommand('crlist', message);
    } else {
        bot.replyTo(message, EMBED_ERROR_COLOR, `Unknown canned message. To create a new canned message, please use the following syntax (anyone can create canned messages):\n\n\`=${name}=Your custom text here\`\n\nThen you can print the content of the canned reply using \`=${name}\` in any channel with this bot in it.\n\nIf you're trying to find a canned reply, you can use the \`=search\` feature, e.g. \`=search rotation\` will show all canned replies with rotation in the name.`);
    }
}
