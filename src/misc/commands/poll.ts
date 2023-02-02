import { MessageEmbed } from 'discord.js';
import { bot } from '../../bot';
import { EMBED_INFO_COLOR, getDisplayName } from '../../utils';

const EMOJI_REGEX = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

bot.registerCommand('poll', [], async message => {
    let lines;

    if (message.content.split("\n").length === 1) {
        let emoji = 127462;
        let [prompt, options] = bot.parseCommand(message, /([A-Z]+ .*?[\?:] )?(.*)/i);
        let choices = options.split(options.includes(',') ? ',' : ' ').map(x => x.trim());

        let pollMsg = `${prompt || 'Please select an option:'}\n\n`;
        
        for (let choice of choices) {
            pollMsg += `${String.fromCodePoint(emoji++)} ${choice}\n`;
        }
        
        const embed = new MessageEmbed()
            .setColor(EMBED_INFO_COLOR)
            .setAuthor({ iconURL: message.author.avatarURL() || '', name: await getDisplayName(message.author, message.guild) })
            .setFooter({ text: `Poll provided by DinoBot via !poll` })
            .setDescription(pollMsg);
        
        message.delete();
        message = await message.channel.send({ embeds: [embed] });
        lines = pollMsg.split('\n\n')[1].slice(0, -1).split('\n');
    } else {
        lines = message.content.split("\n").filter(x => x.match(EMOJI_REGEX) || x.match(/^<a?:[^:]+:[0-9]+>/i));
    }


    for (let line of lines) {
        console.log(line, '---', line.split(' ')[0]);
        await message.react(line.split(' ')[0]);
    }
});
