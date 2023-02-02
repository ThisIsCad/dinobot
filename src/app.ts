import { eventCreationHandler } from './events/creator';
import { threadCreationHandler } from './threads/thread_creator';
import { registerEventReactions } from './events/reaction_signups';
import { antispamHandler } from './misc/antispam';
import { easterEggHandler } from './misc/easter_eggs';
import { cannedReplyHandler } from './cannedreplies/listener';
import { nukeMessageHandler } from './misc/commands/nuke';
import { log } from './utils';
import { client } from './client';
import { DMChannel, GuildTextBasedChannel, Message, TextChannel } from 'discord.js';
import { bot } from './bot';

import './admin/deletion_log';
import './admin/removed_member_log';
import './admin/welcome_channel';
import './admin/commands';
import './cannedreplies/commands';
import './events/commands';
import './threads/commands';
import './misc/commands';

log('info', `--------------------------------------------------------------------`);
log('info', `DinoBot is now initializing...`);
log('info', `--------------------------------------------------------------------`);

client.on('ready', async () => {
  log('info', `Logged in as ${client?.user?.tag}!`);

  client.user?.setActivity('with dinos', { type: 'PLAYING' });

  await Promise.all(client.guilds.cache.map(async guild => {
    log('debug', `Fetching members for server '${guild.name}'`);
    await guild.members.fetch();
    log('debug', `Finished fetching members for server '${guild.name}'`);

    log('debug', `Fetching channels for server '${guild.name}'`);
    await guild.channels.fetch();
    log('debug', `Finished fetching channels for server '${guild.name}'`);
  }));

  log('info', 'Bot initialization and preloading complete. Now listening for commands');
  client.emit('bot:ready');
});

client.on('messageUpdate', async (message) => {
    // Easter egg - emote only channel
    // TODO: Move into separate handler
    if (message.channel instanceof TextChannel && message.channel.name.includes('emotes-only')) {
        message.delete();
    }
});

client.on('messageCreate', async (message) => {
    // In development mode, ignore messages unless listed in BOT_DEVS to avoid duplicate responses
    // from CircusBot (e.g. if both the prod and dev bots respond).
    if (process.env.MODE === 'development' && !bot.config.BOT_DEVS.includes(message.author.id)) {
        return;
    }

    // Ignore messages written by other bots
    if (message.author.bot) {
        return;
    }

    // Easter egg - emote only channel
    // TODO: Move into separate handler
    if (message.channel instanceof TextChannel && message.channel.name.includes('emotes-only')) {
        const text = message.content.replace(/<a?:.+?:\d+>|❤️|[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu, '').replace(/\s+/g, '');

        if (text.trim()) {
            console.log(`Deleting message from ${message.channel.name} by ${message.author.tag}: ${message.content} (remaining text - ${text.length} bytes: ${text})`);
            message.delete();
        }
    }

    // If it's a registered command, call the command handler
    if (bot.isValidCommand(message.content)) {
        bot.runCommand(message);
        return;
    }

    // Check if it's a DM
    if (message.channel instanceof DMChannel) {
        log('info', `New DM from ${message.author.tag}: ${message.content}`);
        return;
    }

    // If the message isn't a registered command, delegate to the event/thread creation wizards
    // in case we are in the process of creating an event/thread.
    eventCreationHandler(message);
    threadCreationHandler(message);
    antispamHandler(message);
    easterEggHandler(message);
    cannedReplyHandler(message);
    nukeMessageHandler(message);
});

if (process.env.MODE === 'development') {
    console.log('Disabling event reaction handler in development mode');
    // registerEventReactions(client);
} else {
    registerEventReactions(client);
}

process.on('unhandledRejection', error => {
    console.error('Unhandled rejection: ', error);
});

client.login(bot.config.BOT_TOKEN);
