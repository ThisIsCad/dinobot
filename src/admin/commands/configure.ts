import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { bot } from '../../bot';
import { client } from '../../client';
import { makeError } from '../../utils';
import { getConfig, saveConfig } from '../configuration';

/**
 * !configure welcome 
 * !configure cannedreplies.enabled [true|false]
 */
bot.registerCommand('configure', ['conf'], async message => {
    const [namespace, option, value] = bot.parseCommand(message, /^(.*?)(?:\.(.*?) ([\s\S]*))?$/m);

    console.log(namespace, option, value);

    if (!(message instanceof Message) || !message.guildId) {
        return;
    }

    if (namespace === 'welcome') {
        const config = getConfig(message.guildId, 'welcome', { enabled: false, admin_roles: ' ', thread_roles: ' ', prefix: '🎪welcome-', greeting: 'Hello <user>! Welcome to **<server>**! 😄' });
        const adminRoles = message.guild?.roles.cache.filter(x => (config.admin_roles || []).includes(x.id));
        const defaultRoles = message.guild?.roles.cache.filter(x => (config.default_roles || []).includes(x.id));
        const threadGroups = message.guild?.roles.cache.filter(x => (config.thread_roles || []).includes(x.id));

        if (option === 'enabled') {
            config.enabled = value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'yes';
        } else if (option === 'prefix') {
            config.prefix = value.replace(/^#/, ''); 
        } else if (option === 'greeting') {
            config.greeting = value; 
        } else if (option === 'message') {
            config.message = value; 
        } else if (option === 'default_roles') {
            const newRoles = value.split(/[ ,]/).map(x => x.replace(/^@/, ''));
            config.default_roles = message.guild?.roles.cache.filter(x => newRoles.includes(x.name)).concat(message.mentions.roles).map(x => x.id);
        } else if (option === 'channel') {
            config.channel = message.mentions.channels.first()?.id;
        } else if (option === 'admin_roles' || option === 'roles') {
            const newRoles = value.split(/[ ,]/).map(x => x.replace(/^@/, ''));
            config.admin_roles = message.guild?.roles.cache.filter(x => newRoles.includes(x.name)).concat(message.mentions.roles).map(x => x.id);
        } else if (option === 'thread_groups' || option === 'thread_roles') {
            const newRoles = value.split(/[ ,]/).map(x => x.replace(/^@/, ''));
            config.thread_roles = message.guild?.roles.cache.filter(x => newRoles.includes(x.name)).concat(message.mentions.roles).map(x => x.id);
        } else if (option) {
            bot.replyTo(message, bot.COLORS.ERROR, makeError('Invalid option'));
            return;
        }

        if (option) {
            saveConfig(message.guildId, 'welcome', config);
            message.react('👍');
            return;
        }

        let welcomeChannel;
        
        try {
            welcomeChannel = await client.channels.fetch(config.channel) as TextChannel;
        } catch {
            welcomeChannel = { name: '<N/A>' };
        }

        const embed = new MessageEmbed()
            .setAuthor({ iconURL: message.guild?.iconURL() || '', name: `Welcome Configuration for "${message.guild?.name}"` })
            .setDescription(
                '🎪 `!configure welcome.enabled`\n' + 
                'Whether or not the welcome module is enabled. If enabled, a unique welcome channel will be created each time a new user ' + 
                'joins the server, and will be archived when they leave or are given a role.\n' + 
                'Current Configuration:\n' + 
                '```\n' + (config.enabled ? 'true' : 'false') + '\n```\n\n' + 

                '⚙️ `!configure welcome.prefix`\n' + 
                'The channel prefix for welcome channels (a random id will be added after the prefix to ensure uniqueness).\n' + 
                'Current Configuration:\n' + 
                '```\n#' + (config.prefix) + '\n```\n\n' + 

                '⚙️ `!configure welcome.admin_roles`\n' + 
                'A list of roles that will be added to the welcome channel when one is created.\n' + 
                'Current Configuration:\n' + 
                '```\n' + (adminRoles?.map(x => `@` + x.name).join(' ') || '-') + '\n```\n\n' + 

                '⚙️ `!configure welcome.default_roles`\n' + 
                'A list of roles that will be added to the user by the !welcome or !nowelcome commands.\n' + 
                'Current Configuration:\n' + 
                '```\n' + (defaultRoles?.map(x => `@` + x.name).join(' ') || '-') + '\n```\n\n' + 

                '⚙️ `!configure welcome.thread_groups`\n' + 
                'A list of possible roles to automatically add the user to. Used to add people to threads given the 100 member limit.\n' + 
                'Current Configuration:\n' + 
                '```\n' + (threadGroups?.map(x => `@` + x.name).join(' ') || '-') + '\n```\n\n' + 

                '⚙️ `!configure welcome.channel`\n' + 
                'The channel to send a welcome message in, once the new user is assigned a role. See `welcome.message` to change the message itself.\n' + 
                'Current Configuration:\n' + 
                '```\n' + (welcomeChannel?.name) + '\n```\n\n' + 

                '⚙️ `!configure welcome.message`\n' + 
                'The channel to send a greeting for if the new user is assigned a role. See `welcome.greeting` to change the message itself.\n' + 
                'Current Configuration:\n' + 
                '```\n' + (config.message) + '\n```\n\n' + 

                '📢 `!configure welcome.greeting`\n' + 
                'The greeting message for DinoBot to send to a user once their welcome channel has been created.\n\n' + 
                'Some helpful tips:\n' + 
                '- You may use <user> in your message to mention/ping the new member.\n' + 
                '- You may use <server> in your message to display this server\'s name.\n' + 
                '- You may use Markdown formatting (e.g. **bold text**) in your message.\n\n' + 
                'Current Configuration:\n' + 
                '```\n' + (config.greeting) + '\n```\n\n' + 
                '');
        bot.replyTo(message, bot.COLORS.INFO, embed);
    } else if (namespace === 'admin') {
        const config = getConfig(message.guildId, 'admin', { removed_user_channel: '' });

        if (option === 'removed_user_channel') {
            config.removed_user_channel = message.mentions.channels.first()?.id;
        } else if (option === 'deletion_log_channel') {
            config.deletion_log_channel = message.mentions.channels.first()?.id;
        } else if (option === 'deletion_notifications') {
            config.deletion_notifications = value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'yes';
        } else if (option) {
            bot.replyTo(message, bot.COLORS.ERROR, makeError('Invalid option'));
            return;
        }

        if (option) {
            saveConfig(message.guildId, 'admin', config);
            message.react('👍');
            return;
        }

        let removedUserChannel, deletionLogChannel;
        
        try {
            removedUserChannel = await client.channels.fetch(config.removed_user_channel) as TextChannel;
        } catch {
            removedUserChannel = { name: '<N/A>' };
        }

        try {
            deletionLogChannel = await client.channels.fetch(config.deletion_log_channel) as TextChannel;
        } catch {
            deletionLogChannel = { name: '<N/A>' };
        }
        
        const embed = new MessageEmbed()
            .setAuthor({ iconURL: message.guild?.iconURL() || '', name: `Administration Config for "${message.guild?.name}"` })
            .setDescription(
                '👋 `!configure admin.removed_user_channel`\n' + 
                'The channel to log when a user leaves, gets kicked, or gets banned from the server. If blank, logs will ' + 
                'be disabled.\n' + 
                'Current Configuration:\n' + 
                '```\n#' + removedUserChannel?.name + '\n```\n\n' + 
                '🗑️ `!configure admin.deletion_log_channel`\n' + 
                'The channel to log when a message is deleted. Only messages deleted by other users are recorded, not messages ' + 
                'by the author themselves (for privacy reasons).\n' + 
                'Current Configuration:\n' + 
                '```\n#' + deletionLogChannel?.name + '\n```\n\n' + 
                '📢 `!configure admin.deletion_notifications`\n' + 
                'Display a notification in the channel when a message is deleted by a moderator.\n' + 
                'Current Configuration:\n' + 
                '```\n#' + (config.deletion_notifications ? 'true' : 'false') + '\n```\n\n' + 
                '');
        bot.replyTo(message, bot.COLORS.INFO, embed);
    } else if (namespace === 'cannedreplies') {

    } else {
        const embed = new MessageEmbed()
            .setAuthor({ iconURL: message.guild?.iconURL() || '', name: `DinoBot Configuration for "${message.guild?.name}"` })
            .setDescription(
                '🎪 `!configure welcome`\n' + 
                'The Welcome module is used to create per-user welcome channels for users, intended for use by private servers ' +
                'that want to vet their members first (or assign specific roles).\n\n' +

                '⚙️ `!configure admin`\n' + 
                'The Admin module contains various helpful tools for server administrators, such as functionality to post when ' +
                'a user has left your server.\n\n' +

                '🥫 `!configure cannedreplies`\n' + 
                'The Canned Replies module allows server members to create "saved messages" under an alias, and have the saved message ' +
                'reposted whenever the alias is used. This module is intended to help create a convenient shared F.A.Q./Knowledge Base, ' + 
                'without relying heavily on pinned comments which can be difficult to sort through.\n\n' +

                '📆 `!configure events`\n' + 
                'The Events module allows server admins to create events that users can sign-up for. Aimed primarily at MMO Raids, events ' +
                'have multiple roles that a user can sign-up as, role limitations, role requirements, and functionality to open/close sign-ups ' +
                'at a specific date/time, message users who signed up, etc.\n\n' +
                '');
        bot.replyTo(message, bot.COLORS.INFO, embed);
    }
});
