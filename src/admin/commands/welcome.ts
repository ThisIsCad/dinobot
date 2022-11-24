import { bot } from '../../bot';
import { findMembers, sendReply, EMBED_ERROR_COLOR } from '../../utils';

bot.registerCommand('welcome', [], async message => {
    if (!message.member || !message.guild) {
        return;
    } else if (!message.member.roles.cache.some(role => ['Bacon Maker', 'Clowncil', 'Goddess of Death'].includes(role.name))) {
        return;
    }

    await message.channel.sendTyping();

    let [userId] = bot.parseCommand(message, /(.*)/);
    const user = await findMembers(message.guild, userId);

    if (!user || user.length !== 1) {
        bot.replyTo(message, EMBED_ERROR_COLOR, 'Unknown user');
        return;
    }

    await message.channel.send({ allowedMentions: { parse: [] }, content: `Welcome ${userId}, feel free to change your username to whatever you like. Check out <#930451305376403476> and select the roles that you'd like to get pinged for! You can also take a look at our <#729370855930462218> to see what we do and when and join us if you can!` });
    message.delete();
});
