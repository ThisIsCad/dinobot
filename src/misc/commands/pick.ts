import { bot } from '../../bot';
import { arrayRandom } from '../../utils';

let messages = [
    `Let's go with $`,
    `Hmm, thats a tough one. How about $`,
    `All good options, but I think $ is the best one`,
    `Why does everyone always want me to decide? I guess $ is ok`,
    `I'm not a fan of any of those options, but let's go with $`,
    `Pfffft, obviously $ is best`,
    `I think $ is the best option`,
    `Luckily I was programmed to be decisive. $ is the right choice`,
    `$, I CHOOSE YOU!`,
    `Since I HAVE to pick an option, I guess I'll go with $`,
    `Good lord, have you considered better options instead? I guess $ is the least bad option`,
    `I summon the power of my random number generator, and choose $!`,
    `Roses are red, violets are blue, I pick $`,
    `<:minky:1037492609611997184>. $. Now leave me alone.`,
    `I advise you to go with $. Please note that I am not a lawyer and this advice is not legally binding.n`,
];

bot.registerCommand('pick', ['choose'], message => {
    let [options] = bot.parseCommand(message, /(.*)/);
    let decisions = options.split(options.includes(',') ? ',' : ' ').map(x => x.trim());
    let roll = arrayRandom(decisions);
    let msg = arrayRandom(messages).replace(/\$/, `**${roll}**`);
    let cad;

    if (cad = decisions.find(x => x.toLowerCase().startsWith('cad'))) {
        msg = `I choose **${cad}**. They are the best!`;
    }

    bot.replyTo(message, bot.COLORS.DM, msg);
});
