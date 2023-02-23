import { ColorResolvable, CommandInteraction, Message, MessageEmbed, PartialUser, TextBasedChannel, User } from 'discord.js';
import { log } from './logging';

export const EMBED_SUCCESS_COLOR = '#77b255';
export const EMBED_ERROR_COLOR = '#e14f5e';
export const EMBED_INFO_COLOR = '#0099ff';
export const EMBED_DMM_COLOR = '#9c59b6';

export const EMOJI_ERROR = '<:error:1078359607329706014>';

export async function startTyping(channel: TextBasedChannel | null) {
    try {
        await channel?.sendTyping();
    } catch (err: any) {
        log('warn', 'sendTyping threw an error: ' + err + ` (HTTP code: ${err.httpStatus})`);
    }
}

export function messageUser(user: User | PartialUser, reply: string, title: string | null = null) {
    const embed = new MessageEmbed()
        .setColor(EMBED_DMM_COLOR)
        .setDescription(reply)

    if (title) {
        embed.setTitle(title);
    }

    user.send({ embeds: [embed] });

    return null;
}

export async function sendReply(message: Message<boolean> | CommandInteraction, color: ColorResolvable, reply: string | MessageEmbed) {
    await startTyping(message.channel);

    let embed: MessageEmbed;

    if (reply === undefined || reply === null) {
        return Promise.reject('Reply is undefined or null');
    }

    if (reply instanceof MessageEmbed) {
        embed = reply.setColor(color);
    } else if (reply.startsWith('noembed:')) {
        return await message.reply({ allowedMentions: { repliedUser: false }, content: reply.substring(8) });
    } else {
        embed = new MessageEmbed()
            .setColor(color)
            .setDescription(reply)
    }

    return await message.reply({ allowedMentions: { repliedUser: false }, embeds: [embed] });
}

export function sendMessage(channel: TextBasedChannel, message: string) {
    const embed = new MessageEmbed()
        .setColor(EMBED_SUCCESS_COLOR)
        .setDescription(message)

    channel.send({ embeds: [embed] });

    return null;
}

export function makeError(message: string) {
    const embed = new MessageEmbed()
        .setColor(EMBED_ERROR_COLOR)
        .setDescription(EMOJI_ERROR + ' ' + message)
    
    return embed;
}

export function makeSuccess(message: string) {
    const embed = new MessageEmbed()
        .setColor(EMBED_SUCCESS_COLOR)
        .setDescription('✅' + ' ' + message)
    
    return embed;
}

export function sendError(channel: TextBasedChannel, message: string) {
    channel.send({ embeds: [makeError(message)] });

    return null;
}

export function makeTable(columns: string[], fields: string[][]) {
    const embed = new MessageEmbed()
        .setColor(EMBED_INFO_COLOR)
        .addFields([ 
            { name: columns[0], value: fields.map(x => x[0]).join('\n'), inline: true },
            { name: columns[1], value: fields.map(x => x[1]).join('\n'), inline: true },
            { name: columns[2], value: fields.map(x => x[2]).join('\n'), inline: true },
        ]);
    return embed;
}