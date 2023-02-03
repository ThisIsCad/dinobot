import { GuildAuditLogsEntry, MessageEmbed, TextChannel } from "discord.js";
import { client } from "../client";
import { diffDate, EMBED_INFO_COLOR, findMembers, getFormattedDate, log, sendMessage } from "../utils";
import { getConfig } from "./configuration";

const auditLogs = {};

client.on('messageDelete', msg => onMessageDelete(msg, false));

client.on('messageDeleteBulk', async messages => {
    console.log('messageDeleteBulk event detected');
    messages.forEach(x => onMessageDelete(x, true));
});

async function onMessageDelete(message, bulk) {
	// Ignore direct messages
	if (!message.guild) return;

    // Is the deletion log feature enabled?
    const config = getConfig(message.guild.id, 'admin', { deletion_log_channel: null });
    if (!config.deletion_log_channel) return;
    const logChannel = await client.channels.fetch(config.deletion_log_channel) as TextChannel;

    // Grab the most recent MEMBER_KICK audit event to see if this user was kicked or left on their own
    let fetchedDeletes;

    try {
        fetchedDeletes = await message.guild?.fetchAuditLogs({ limit: 5, type: bulk ? 'MESSAGE_BULK_DELETE' : 'MESSAGE_DELETE' });
    } catch (err) {
        log('err', `Unabled to fetch audit logs to check deletion logs: ${err}`);
        return;
    }

    const deletionLogs = fetchedDeletes.entries.values();  
    let deletionLog: GuildAuditLogsEntry<any> | null = null;

    for (let log of deletionLogs) {
        if (bulk && log.target.id === message.channelId && log.extra.count - (auditLogs[log.id] || 0) > 0 && diffDate(log.createdAt, new Date()) < 300) {
            deletionLog = log;
            auditLogs[log.id] = (auditLogs[log.id] || 0) + 1;
            break;    
        } else if (log.target.id === message.author?.id && log.extra.channel.id === message.channelId && log.extra.count - (auditLogs[log.id] || 0) > 0 && diffDate(log.createdAt, new Date()) < 300) {
            deletionLog = log;
            auditLogs[log.id] = (auditLogs[log.id] || 0) + 1;
            break;
        } else if (!message.author && log.extra.channel.id === message.channelId && log.extra.count - (auditLogs[log.id] || 0) > 0 && diffDate(log.createdAt, new Date()) < 60) {
            deletionLog = log;
            auditLogs[log.id] = (auditLogs[log.id] || 0) + 1;
            break;
        }
    }
    
	// Perform a coherence check to make sure that there's *something*
	if (!deletionLog) {
        return console.log(`A message by ${message.author?.tag} in #${message.channel.name} was deleted, but no relevant audit logs were found.`);
    }

    if (bulk || (deletionLog.target.id === message.author?.id && deletionLog.extra.channel.id === message.channelId && diffDate(deletionLog.createdAt, new Date()) < 300)) {
		console.log(`A message by ${message.author.tag} in #${message.channel.name} was deleted by ${deletionLog.executor?.tag} (log #${deletionLog.id}).`);

        if (config.deletion_notifications && !message.channel.isThread() && !deletionLog.executor?.bot) {
            if (deletionLog.target.id === '912376778939584562') {
                if (message.content?.includes('IS BULLYING ME') || message.content?.includes('THIS IS BOT ABUSE')) {
                    message.channel.send(`THIS IS BOT ABUSE <a:peepoRunCry:828026129788436491>`);
                } else if (message.content?.includes('GOING TO DELETE THEM')) {
                    message.channel.send(`<@200716538729201664> HALP, <@${deletionLog.executor?.id}> IS BULLYING ME AND KEEPS DELETING MY MESSAGE <:ANGERY:823203660603457567>`);
                } else if (message.content?.includes('ABOUT DELETING MY OTHER MESSAGE')) {
                    message.channel.send(`IF <@${deletionLog.executor?.id}> DOESN'T STOP DELETING MY MESSAGES I'M GOING TO DELETE THEM <:ANGERY:823203660603457567>`);
                } else if (message.content?.includes('deleted one of my messages')) {
                    message.channel.send(`<@${deletionLog.executor?.id}> DELETED MY MESSAGE ABOUT DELETING MY OTHER MESSAGE <:smadge:952346837136842762>`);
                } else {
                    message.channel.send(`<@${deletionLog.executor?.id}> deleted one of my messages <:smadge:952346837136842762>`);
                }
            } else {
                sendMessage(message.channel, `<:pepetrash:740924034493055038> A message from <@${message.author.id}> was deleted by <@${deletionLog.executor?.id}> (log #${deletionLog.id}).`);
            }
        }

        let content = (message.content || '').split("\n").join("\n> ");
        let embeds = [];

        let description = `<@${deletionLog.executor?.id}> deleted a message in <#${message.channel.id}> from <@${message.author.id}>.`;

        if (content.trim().length > 0) {
            description += ` Message content:\n\n> ${content}`;
        }

        if (message.author.id === '912376778939584562' && message.embeds.length > 0) {
            description += `\n\nAttaching original message embeds below:`;
            embeds = message.embeds;
        }

        // Send the message in the designated channel
        const embed = new MessageEmbed()
        .setColor(EMBED_INFO_COLOR)
        .setAuthor({
            iconURL: message.author.displayAvatarURL() || '',
            name: `${deletionLog.executor?.tag} deleted a message from ${message.author.tag}`
        })
        .setFooter({ text: `Audit log recorded at ${getFormattedDate(deletionLog.createdAt)} • Audit ID #${deletionLog.id}` })
        .setDescription(description);

        await logChannel.send({ embeds: [embed] });

        if (embeds.length > 0) {
            await logChannel.send({ embeds });
        }
    } else if (!message.author && deletionLog.extra.channel.id === message.channelId && diffDate(deletionLog.createdAt, new Date()) < 60) {
        // attempt to find the user
        let members = await findMembers(message.guild, `<@${deletionLog.target.id}>`);
        let author = `<@${deletionLog.target.id}>`;

        if (members.length === 1) {
            author = members[0]?.user.tag || '';
        }

		console.log(`A message by ${author} in #${message.channel.name} was deleted by ${deletionLog.executor?.tag} (log #${deletionLog.id}).`);

        if (config.deletion_notifications && !message.channel.isThread() && !deletionLog.executor?.bot) {
            if (deletionLog.target.id === '912376778939584562') {
                message.channel.send(`<@${deletionLog.executor?.id}> deleted one of my messages <:smadge:952346837136842762>`);
            } else {
                sendMessage(message.channel, `<:pepetrash:740924034493055038> A message from <@${deletionLog.target.id}> was deleted by <@${deletionLog.executor?.id}> (log #${deletionLog.id}).`);
            }
        }

        // Send the message in the designated channel
        const embed = new MessageEmbed()
        .setColor(EMBED_INFO_COLOR)
        .setAuthor({
            iconURL: members[0]?.displayAvatarURL() || '',
            name: `${deletionLog.executor?.tag} deleted a message from ${author}`
        })
        .setFooter({ text: `Audit log recorded at ${getFormattedDate(deletionLog.createdAt)} • Audit ID #${deletionLog.id}` })
        .setDescription(`<@${deletionLog.executor?.id}> deleted a message in <#${message.channel.id}> from <@${deletionLog.target.id}>. No message content available (bot cache does not contain the deleted message)`);

        await logChannel.send({ embeds: [embed] });
    } else {
        console.log(`A message by ${message.author?.tag} in #${message.channel.name} was deleted (no corresponding audit log detected - user probably deleted their own message`);
    }
}