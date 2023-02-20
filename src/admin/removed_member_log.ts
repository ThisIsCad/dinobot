import { GuildTextBasedChannel, MessageEmbed, TextChannel } from "discord.js";
import { client } from "../client";
import { arrayRandom, diffDate, EMBED_ERROR_COLOR, getFormattedDate, log } from "../utils";
import { getConfig } from "./configuration";
import { archiveWelcomeChannel } from "./welcome_channel";

const memberLeftMessages = [
    `Was it something I said? <:sadge:1069981541918331031>`,
    `I guess we pinged them one too many times <:sadge:1069981541918331031>`,
    `I hope we didn't scare them away <:sadge:1069981541918331031>`,
    `I'll try not to take it personallyy <:sadge:1069981541918331031>`,
    `Maybe they accidentally left the server <:sadge:1069981541918331031>`,
    `Perhaps I scared them away <:sadge:1069981541918331031>`,
    `Looks like our brainwashing failed to keep them here <:sadge:1069981541918331031>`,
    `Sad! Let's just hope that they enjoyed their stay <:sadge:1069981541918331031>`,
    `Awww man, hopefully they enjoyed their stay <:sadge:1069981541918331031>`,
    `Oh no, another one bites the dust! Hopefully they enjoyed their stay <:sadge:1069981541918331031>`,
    `That's disappointing! Let's just hope they enjoyed their stay <:sadge:1069981541918331031>`,
    `What a travesty! It always sucks to see someone go <:sadge:1069981541918331031>`,
];

client.on('guildMemberRemove', async member => {
    let channel: GuildTextBasedChannel, goodbye: string, message: string;
    const config = getConfig(member.guild.id, 'admin', { removed_user_channel: null });
    const nickname = member.nickname || member.user.tag;

    log('info', `${member.user.tag} (${nickname}) has just left ${member.guild.name}`);

    // Grab the most recent MEMBER_KICK audit event to see if this user was kicked or left on their own
    const fetchedBans = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_ADD' });
    const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
    const banLog = fetchedBans.entries.first();
    const kickLog = fetchedLogs.entries.first();
    
    // Custom messages for kicked users versus those who left on their own
    if (banLog?.target?.id === member.id && diffDate(banLog.createdAt, new Date()) < 300) {
        message = 'just got banned from the server!'
        goodbye = `And don't EVER come back <:pepeGun:821569090304999424>! Thanks <@${banLog.executor?.id}> for taking care of that. Reason: ${banLog.reason?.trim()}`
    } else if (kickLog?.target?.id === member.id && diffDate(kickLog.createdAt, new Date()) < 300 && member.roles.cache.entries.length === 0) {
        message = 'just got removed from the server'
        goodbye = `Looks like they didn't have a role yet, maybe they'll come back later. Thanks <@${kickLog.executor?.id}> for keeping the server clean. Reason: ${kickLog.reason?.trim()}`
    }  else if (kickLog?.target?.id === member.id && diffDate(kickLog.createdAt, new Date()) < 300) {
        message = 'just got kicked from the server!'
        goodbye = `Adios amigo! Thanks <@${kickLog.executor?.id}> for taking out the trash <:pepetrash:740924034493055038>. Reason: ${kickLog.reason?.trim()}`
    } else if (member.joinedAt && diffDate(member.joinedAt, new Date()) < 60 * 60 * 4) {
        message = 'just left the server!';
        goodbye = `Aww man, they didn't even get to know us yet <:sadge:1069981541918331031>`;
    } else {
        message = 'just left the server!';
        goodbye = arrayRandom(memberLeftMessages);
    }
    
    // If this returns true, they had a welcome channel and weren't a full member
    if (await archiveWelcomeChannel(member.id, member.user.tag, member.guild, member.displayAvatarURL(), `${member.user.tag} ${message}`)) {
        return;
    }

    if (!config.removed_user_channel) {
        return;
    }

    channel = await client.channels.fetch(config.removed_user_channel) as TextChannel;

    // Include their roles so they can be restored easier if the user accidentally left or comes back later
    let roles = member.roles.cache.filter(x => x.name !== '@everyone');
    let roleText = roles.size > 0 ? `Their roles were:\n\n${roles.map(x => `- <@&${x.id}>`).join('\n')}` : `They had no roles (maybe they were new)`;

    // Send the message in the designated channel
    const embed = new MessageEmbed()
        .setColor(EMBED_ERROR_COLOR)
        .setAuthor({
            iconURL: member.user.displayAvatarURL() || '',
            name: `${nickname} ${message}`
        })
        .setDescription(`${goodbye}\n\n${member.user.tag} initially joined the server on ${getFormattedDate(member.joinedAt)}. ${roleText}`)

    channel.send({ embeds: [embed] });
});
