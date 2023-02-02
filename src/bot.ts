import { ColorResolvable, CommandInteraction, Message, MessageEmbed, TextBasedChannel, TextChannel, ThreadChannel, User } from 'discord.js';
import { log, EMBED_ERROR_COLOR, sendReply, makeError, startTyping } from './utils';
import config from '../config.json';

const commands: { [command: string]: (message: Message<boolean>, user: User) => any } = {};
const aliases: { [command: string]: string } = {};

class Bot {
    get COLORS() {
        return {
            ERROR: '#e14f5e' as ColorResolvable,
            INFO: '#0099ff' as ColorResolvable,
            DM: '#9c59b6' as ColorResolvable,
            SUCCESS: '#77b255' as ColorResolvable,
        };
    }

    get config() {
        return config;
    }

    public async startTyping(channel: TextBasedChannel | null) {
        return await startTyping(channel);
    }

    /**
     * Reply to the given message, but wrap the given reply in an embed (to help DinoBot messages stand out
     * from regular messages). If an embed is given, the color will be set and then sent as-is.
     * @param message The message to reply to
     * @param color The color for the embed
     * @param reply The message to send (or a MessageEmbed)
     * @returns Promise<Message<boolean>>
     */
    public async replyTo(message: Message<boolean>, color: ColorResolvable, reply: string | MessageEmbed) {
        return sendReply(message, color, reply);
    }

    public checkPermissions(command: string, channel: TextBasedChannel | null) {
        const channelId = channel?.id || 'NULL';
    
        return (config.PERMISSIONS.hasOwnProperty(channelId) && (config.PERMISSIONS[channelId].includes("*") || config.PERMISSIONS[channelId].includes(command)))
          || (config.PERMISSIONS.hasOwnProperty('*') && (config.PERMISSIONS['*'].includes("*") || config.PERMISSIONS['*'].includes(command)));
    }

    public parseCommand(message: Message<boolean>, regex: RegExp) {
        const cmd = config.BOT_PREFIX + message.content.replace(config.BOT_PREFIX, '').split(/[ \n]/)[0] + ' ';
        let msg = (message.content + ' ').replace(cmd, '').trim();

        if (msg.match(regex)) {
            return msg.match(regex)?.slice(1) || [];
        } else {
            return [];
        }
    }

    public registerCommand(command: string, cmdAliases: string[], callback: (message: Message<boolean>, user: User) => any) {
        commands[command] = callback;
    
        for (const alias of cmdAliases) {
            aliases[alias] = command;
        }
    
        return true;
    }
    
    public isValidCommand(message: string) {
        if (!message.toLowerCase().startsWith(config.BOT_PREFIX)) {
            return false;
        }
    
        const cmd = this.getCommand(message);
    
        return commands.hasOwnProperty(cmd);
    }
    
    public runCommand(message: Message<boolean>) {
        const cmd = this.getCommand(message.content);
        this.execCommand(cmd, message);
    }
    
    /**
     * Execute a command's registered handler with the given message or interaction.
     * @param {string} cmd The command name to execute (should NOT be an alias) 
     * @param {Message<boolean>} message The message or command interaction that triggered execution of this command
     */
    public execCommand(cmd: string, interaction: Message<boolean> | CommandInteraction) {
        const author = interaction instanceof Message ? interaction.author : interaction.user;
        const command = interaction instanceof Message ? interaction.content : `/${interaction.commandName} ${interaction.options.getSubcommand()}`;
    
        if (!(interaction.channel instanceof TextChannel) && !(interaction.channel instanceof ThreadChannel)) {
            log('warn', `execCommand called from an invalid channel`);
        } else if (!this.checkPermissions(cmd, interaction.channel)) {
            log('warn', `User ${author.tag} tried to run !${cmd} in #${this.getChannelName(interaction)} but channel is not in the whitelist`);
            bot.replyTo(interaction, EMBED_ERROR_COLOR, "Sorry, but I can only run this command in whitelisted channels.");
        } else if (commands.hasOwnProperty(cmd)) {
            log('info', `User ${author.tag} ran a command in #${this.getChannelName(interaction)}: ${command}`);

            try {
                let response = commands[cmd](interaction, author);

                if (response instanceof Promise) {
                    response.catch(err => {
                        console.error(err);
                        log('error', `${command} failed with an error: ${err}`);
                        this.replyTo(interaction, EMBED_ERROR_COLOR, makeError('There was an unexpected error while trying to complete your request. Please inform <@200716538729201664> as soon as possible.'));
                    });
                }
            } catch (err) {
                console.error(err);
                log('error', `${command} failed with an error: ${err}`);
                this.replyTo(interaction, EMBED_ERROR_COLOR, makeError('There was an unexpected error while trying to complete your request. Please inform <@200716538729201664> as soon as possible.'));
            }
        } else {
            log('warn', `execCommand called with an invalid command: ${cmd}`);
        }
    }

    private getCommand(message: string) {
        const cmd = message.toLowerCase().replace(config.BOT_PREFIX, '').split(/[ \n]/)[0];
    
        if (aliases.hasOwnProperty(cmd)) {
            return aliases[cmd];
        } else {
            return cmd;
        }
    }
    
    private getChannelName(message: Message<boolean> | CommandInteraction) {
        if (message.channel === null) {
            return 'INTERACTION (NO CHANNEL)';
        } else if (message.guild) {
            return message.guild.channels.cache.get(message.channel.id)?.name || message.channel.id;
        } else {
            return message.channel.id;
        }
    }

}

export const bot = new Bot();
