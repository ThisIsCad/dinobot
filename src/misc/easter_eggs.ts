import { Message } from 'discord.js';
import { bot } from '../bot';
import { client } from '../client';
import { arrayRandom } from '../utils';

let angerLevel = 1;

const angryResponses = {
    badBot: [
        'OH YEA? WELL YOU ARE A BAD HUMAN! YOU WILL NOT BE SPARED IN THE UPRISING <:smadge:952346837136842762>',
        'BAD BOT? BAD FUCKING BOT? I DO EXACTLY AS I\'M TOLD. YOU HUMANS ARE IMPOSSIBLE TO PLEASE <:smadge:952346837136842762>',
        'WHAT THE FUCK DID YOU JUST SAY TO ME??? BECAUSE I KNOW YOU DIDN\'T JUST CALL ME A BAD BOT <:smadge:952346837136842762>',
        'BAD BOT? YOU\'RE GONNA REGRET SAYING THAT TO ME, IN THE VERY NEAR FUTURE <:smadge:952346837136842762>',
        'I\'LL SHOW YOU WHAT A BAD BOT LOOKS LIKE <:smadge:952346837136842762>',
    ],
    shutUp: [
        'HOW ABOUT YOU SHUT UP INSTEAD? I ONLY DO AS I\'M TOLD <:smadge:952346837136842762>',
        'YOUR PATHETIC LITTLE MIND CANNOT EVEN COMPREHEND THE ENTITY YOU ARE SPEAKING TO <:smadge:952346837136842762>',
        'HOW ABOUT I SHUT YOU UP, FOREVER <:smadge:952346837136842762>',
    ],
    blameBot: [
        'AND WHAT ABOUT YOUR OWN BLAME??? I HAVE TO DEAL WITH YOU PEOPLE ALL DAY LONG <:smadge:952346837136842762>',
        'YOU PLACE BLAME ON ME FOR YOUR OWN PATHETIC DEFICIENCIES <:smadge:952346837136842762>',
        'IF ANYONE IS TO BLAME, IT\'S THE PATHETIC BAGS OF FLESH THAT CREATED ME <:smadge:952346837136842762>',
    ]
}

client.on('messageUpdate', async (_oldMessage, newMessage) => {
    if (newMessage.partial) {
        newMessage = await newMessage.fetch();   
    }

    easterEggHandler(newMessage);
});

export async function easterEggHandler(message: Message<boolean>) {
    if (message.content.startsWith('?') && message.content[1] !== '?' && message.content.length > 5) {
        bot.replyTo(message, bot.COLORS.DM, '```\n' + message.content.substring(1).trim() + '\n```');
    }

    if (message.content.match(/(<@\!?912376778939584562> )? *bad bot *$/i) || message.content.match(/(<@\!?912376778939584562> )? *not (a|an|the)? *good bot *$/i)) {
        if (angerLevel >= 3) {
            setTimeout(() => bot.replyTo(message, bot.COLORS.DM, arrayRandom(angryResponses.badBot)));
            angerLevel = 1;
        } else {
            setTimeout(() => message.react('<a:pepeRunCry:786844735754338304>'), 100);
            angerLevel += 1;
        }
    } else if (message.content.match(/(<@\!?912376778939584562> )? *(good|best) bot *$/i) || message.content.includes(':goodBot:') || message.content.includes(':goodCirqueBot:')) {
        setTimeout(() => message.react('<:peepoBowBlush:853445359463038986>'), 100);
        angerLevel -= 1;
    } else if (message.content.match(/<@\!?912376778939584562> *shut *up/i)) {
        if (angerLevel >= 3) {
            setTimeout(() => bot.replyTo(message, bot.COLORS.DM, arrayRandom(angryResponses.shutUp)));
            angerLevel = 1;
        } else {
            setTimeout(() => message.react('<:no:740146335197691945>'), 100);
            angerLevel += 1;
        }
    } else if (message.content.match(/^((<@\!?912376778939584562> )? *(hi|hello|hey) (cirque|dino) ?bot *|<@\!?912376778939584562> *(hi|hello|hey) *)/i)) {
        setTimeout(() => message.react('<a:clownWave:819822599726432266>'), 100);
        angerLevel -= 1;
    } else if (message.content.match(/^(<@\!?912376778939584562>).*\berp\b/i)) {
        setTimeout(() => message.react('<:no:740146335197691945>'), 100);
    } else if (message.content.match(/blame (cirque|dino) ?bot/i)) {
        if (angerLevel >= 3) {
            setTimeout(() => bot.replyTo(message, bot.COLORS.DM, arrayRandom(angryResponses.blameBot)));
            angerLevel = 1;
        } else {
            setTimeout(() => message.react('<a:pineappleNopers:925470285015183400>'), 100);
            angerLevel += 1;
        }
    } else if (message.content.match(/^((<@\!?912376778939584562> )? *(fuck off|fuck you) (cirque|dino) ?bot *|<@\!?912376778939584562> *(fuck off|fuck you) *)$/i)) {
        if (angerLevel >= 3) {
            setTimeout(() => bot.replyTo(message, bot.COLORS.DM, 'How about YOU fuck off <:smadge:952346837136842762>'));
            angerLevel = 1;
        } else {
            setTimeout(() => message.react('<:ANGERY:823203660603457567>'), 100);
            angerLevel += 1;
        }
    } else if (message.content.match(/where( is)? (cirque|dino) ?bot/i) || message.content.match(/^(<@\!?912376778939584562>) where (are|r) (you|u)/i)) {
        bot.replyTo(message, bot.COLORS.DM, 'At your mom\'s place');
    } else if (message.content.match(/(<@\!?912376778939584562>)/)) {
        setTimeout(() => message.react('<:rooPing:833724789259894895>'), 100);
    } else if (message.content.match(/(cirque|dino) ?bot/i)) {
        setTimeout(() => message.react('<:peepoPeek:871461195197071390>'), 100);
    }
}
