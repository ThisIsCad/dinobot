import { Guild, GuildMember, MessageEmbed, OverwriteResolvable, TextChannel } from "discord.js";
import { client } from "../client";
import { EMBED_ERROR_COLOR, EMBED_INFO_COLOR, findMember, getFormattedDate, loadPersistentData, log, randomStr, savePersistentData } from "../utils";
import { getConfig } from "./configuration";

const userWelcomeChannels = loadPersistentData('welcome', {});
const threadRoles = {};
export const quietWelcomeChannels = {};

// Cleanup any welcome channels that should have been deleted by event handlers, but
// maybe the bot wasn't running.
client.on('ready', async () => {
  client.guilds.cache.forEach(async guild => {
    userWelcomeChannels[guild.id] ||= {};

    const config = getConfig(guild.id, 'welcome', { enabled: false });
    if (!config.enabled) return;

    await guild.channels.fetch();

    if (config.thread_roles) {
        const threadGroups = guild.roles.cache.filter(x => config.thread_roles.includes(x.id));
        threadRoles[guild.id] = Object.fromEntries(threadGroups.map(x => [x.id, x.members.size]));
    }

    guild.channels.cache.forEach(async channel => {
        if (!channel.name.startsWith(config.prefix) || !(channel instanceof TextChannel) || !channel.topic) {
            return;
        }

        const username = (channel.topic?.match(/, (.*)\!/i) || [])[1];
        const memberId = Object.keys(userWelcomeChannels[guild.id]).find(key => userWelcomeChannels[guild.id][key] === channel.id);

        if (!memberId || !username) {
            return;
        }

        const member = await findMember(channel.guild, username);

        if (member === null) {
            archiveWelcomeChannel(memberId, username, guild, null, `${username} has left the server`);
        } else if (member.roles.cache.size > 1) {
            archiveWelcomeChannel(memberId, username, guild, null, `${username} was given a role`);
        }
    })
  });
});

client.on('guildMemberAdd', async member => {
    log('info', `${member.user.tag} has just joined ${member.guild.name}`);

    const config = getConfig(member.guild.id, 'welcome', { enabled: false });

    if (member.user.tag.startsWith('ceph#') || member.user.tag.startsWith('cephana#')) {
        const embed = new MessageEmbed()
            .setColor(EMBED_ERROR_COLOR)
            .setAuthor({ iconURL: member.displayAvatarURL() || '', name: `DinoBot Protection Protocol` })
            .setDescription(`<@${member.user.id}> has been automatically kicked by DinoBot via Protect Cad Directive.`);

        member.guild.systemChannel?.send({ embeds: [embed] });
        return;
    }
    
    if (!config.enabled || member.user.bot) {
        if (member.guild.systemChannel) {
            const embed = new MessageEmbed()
                .setColor(EMBED_INFO_COLOR)
                .setAuthor({ iconURL: member.displayAvatarURL() || '', name: `${member.user.tag} has joined the server.` })
                .setDescription(`<@${member.user.id}> has joined the server. Maybe say hello <:dinolove:1067805819262996502>`);
            member.guild.systemChannel.send({ embeds: [embed] });
        }

        return;
    }

    createWelcomeChannel(member, true);
});

// When a guild member is updated, check if its a member who has no roles, receiving a
// role (e.g. a new user receiving the Piglet role).
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.roles.cache.size === 1 && newMember.roles.cache.size > 1 && userWelcomeChannels[newMember.guild.id].hasOwnProperty(newMember.id)) {
        archiveWelcomeChannel(newMember.id, newMember.user.tag, newMember.guild, newMember.displayAvatarURL(), `${newMember.user.tag} was given a role`, newMember.roles.cache);
        
        if (Object.values(threadRoles[newMember.guild.id]).length > 0) {
            const roleId = Object.entries(threadRoles[newMember.guild.id]).filter((x: any) => x[1] < 99)[0][0];
            const role = newMember.guild.roles.cache.find(x => x.id === roleId);

            if (!role) {
                log('warn', `Unable to assign thread group to ${newMember.user.tag}, no available groups found`);
                return;
            }

            log('info', `Assigning new member ${newMember.user.tag} to thread group '${role.name}'`);
            newMember.roles.add(role);
            threadRoles[newMember.guild.id][roleId] += 1;
        }
    }
});

/**
 * Create a welcome channel for the specified member. Can optionally ping/not ping the member,
 * e.g. if this feature is being enabled on a server that didn't previously use it.
 * @param member The GuildMember to create a welcome channel for
 * @param ping Whether or not to ping the user in the welcome message
 */
export async function createWelcomeChannel(member: GuildMember, ping: boolean) {
    const config = getConfig(member.guild.id, 'welcome', {});
    const name = randomStr(6);

    const channel = await member.guild.channels.create(`${config.prefix}${name}`, {
        type: 'GUILD_TEXT',
        position: 0,
        reason: `${member.user.tag} has just joined ${member.guild.name}`,
        topic: `Welcome to ${member.guild.name}, ${member.user.tag}!`,
        permissionOverwrites: [
            {
                // Start with an explicit deny for @everyone
                id: member.guild.id,
                deny: ['VIEW_CHANNEL'],
            },
        ].concat(config.admin_roles.concat(client.user?.id, member.id).map(x => {
            return {
                id: x,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
            };
        })) as OverwriteResolvable[],
      });

    userWelcomeChannels[member.guild.id][member.id] = channel.id;
    savePersistentData('welcome', userWelcomeChannels);

    channel.send({ 
        allowedMentions: ping ? {} : { parse: [] },
        content: config.greeting.replace(/<user>/i, `<@${member.id}>`).replace(/<server>/i, member.guild.name)
    });
}

export async function archiveWelcomeChannel(memberId: string, userTag: string, guild: Guild, avatar: string | null, reason: string, roleCache?: any) {
    if (!userWelcomeChannels[guild.id].hasOwnProperty(memberId)) {
        return false;
    }

    let channel;

    try {
        channel = await client.channels.fetch(userWelcomeChannels[guild.id][memberId]);
    } catch (err) {
        log('warn', `Unable to archive welcome channel for ${userTag} in ${guild.name}: Could not find channel`);
        return false;
    }

    const config = getConfig(guild.id, 'welcome', { enabled: false });

    if (!channel || !(channel instanceof TextChannel)) {
        log('warn', `Unable to archive welcome channel for ${userTag} in ${guild.name}: Could not find channel`);
        return false;
    }

    const messages = await channel.messages.fetch();

    log('info', `Deleting welcome channel for ${userTag} in ${guild.name} (${reason})`);

    let messageLog = '';
    let transcript = '';
    let hasTranscript = false;

    messages.reverse().forEach(message => {
        hasTranscript = transcript !== '';
        transcript += `<@${message.author.id}>: ${message.content}\n\n`;
        messageLog += `[${getFormattedDate(message.createdAt)}] ${message.author.tag}: ${message.content}\n`;
    });

    if (hasTranscript) {
        transcript = `Transcript:\n\n> \n> ${transcript.trim().replace(/\n/g, '\n> ')}\n> ⠀\n`;
    } else {
        transcript = `Transcript: N/A (no messages posted to welcome channel)`;
    }

    const embed = new MessageEmbed()
        .setColor(reason.match(/(left|banned|removed|kicked)/i) ? EMBED_ERROR_COLOR : EMBED_INFO_COLOR)
        .setAuthor({ iconURL: avatar || '', name: `The welcome channel for ${userTag} has been archived` })
        .setDescription(`The welcome channel for <@${memberId}> has been archived (${reason}). ${transcript}`);

    guild.systemChannel?.send({ embeds: [embed] });

    setTimeout(() => {
        channel?.delete(reason);
    }, 15000);
    delete userWelcomeChannels[guild.id][memberId];
    savePersistentData('welcome', userWelcomeChannels);

    if (!quietWelcomeChannels[channel.id] && reason.includes('given a role') && roleCache?.some(x => config.default_roles.includes(x.id))) {
        let greetingChannel = await client.channels.fetch(config.channel) as TextChannel;
        await greetingChannel.send({ content: config.message.replace(/<user>/i, `<@${memberId}>`).replace(/<server>/i, guild.name) });
    }

    return true;
}