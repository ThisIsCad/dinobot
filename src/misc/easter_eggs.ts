import { Message } from 'discord.js';
import { bot } from '../bot';
import { client } from '../client';
import { CLOWNS_GUILD_ID, SANDBOX_GUILD_ID } from '../constants';
import { loadPersistentData, savePersistentData } from '../utils';

const easterEggData = loadPersistentData('eastereggs', { clowncilWarnings: { '__recent__': 0 } });
const SHADOW_CLOWNCIL_REGEX = /([s5].{0,4}h.{0,4}[a@4].{0,4}d.{0,4}[0o].{0,4}w.{0,4} c.{0,4}[1il].{0,4}[0o].{0,4}w.{0,4}n.{0,4}c.{0,4}[i1l].{0,4}[1il])/i;

client.on('messageUpdate', async (_oldMessage, newMessage) => {
    if (newMessage.partial) {
        newMessage = await newMessage.fetch();   
    }

    easterEggHandler(newMessage);
});

export async function easterEggHandler(message: Message<boolean>) {
    if (message.content.startsWith('?') && message.content.length > 5) {
        bot.replyTo(message, bot.COLORS.DM, '```\n' + message.content + '\n```');
    }

    if (message.content.match(/(<@\!?912376778939584562> )? *good bot *$/i) || message.content.includes(':goodBot:') || message.content.includes(':goodCirqueBot:')) {
        setTimeout(() => message.react('<:peepoBowBlush:853445359463038986>'), 100);
    } else if (message.content.match(/(<@\!?912376778939584562> )? *bad bot *$/i)) {
        setTimeout(() => message.react('<a:pepeRunCry:786844735754338304>'), 100);
    } else if (message.content.match(/^((<@\!?912376778939584562> )? *(hi|hello|hey) cirque ?bot *|<@\!?912376778939584562> *(hi|hello|hey) *)/i)) {
        setTimeout(() => message.react('<a:clownWave:819822599726432266>'), 100);
    } else if (message.content.match(/^(<@\!?912376778939584562>).*\berp\b/i)) {
        setTimeout(() => message.react('<:no:740146335197691945>'), 100);
    } else if (message.content.match(/blame cirque ?bot/i)) {
        setTimeout(() => message.react('<a:pineappleNopers:925470285015183400>'), 100);
    } else if (message.content.match(/^((<@\!?912376778939584562> )? *(fuck off|fuck you) cirque ?bot *|<@\!?912376778939584562> *(fuck off|fuck you) *)$/i)) {
        setTimeout(() => message.react('<:ANGERY:823203660603457567>'), 100);
    } else if (message.content.match(/where( is)? cirque ?bot/i) || message.content.match(/^(<@\!?912376778939584562>) where (are|r) (you|u)/i)) {
        bot.replyTo(message, bot.COLORS.DM, 'At your mom\'s place');
    } else if (message.content.match(/(<@\!?912376778939584562>)/)) {
        setTimeout(() => message.react('<:rooPing:833724789259894895>'), 100);
    } 

    if (message.content.toLowerCase().match(SHADOW_CLOWNCIL_REGEX) && [CLOWNS_GUILD_ID, SANDBOX_GUILD_ID].includes(message.guildId || '')) {
        const clowncilWarnings = easterEggData.clowncilWarnings;
        clowncilWarnings[message.author.id] = clowncilWarnings.hasOwnProperty(message.author.id) ? clowncilWarnings[message.author.id] + 1 : 1;
        clowncilWarnings.__recent__ += 1;
        savePersistentData('eastereggs', easterEggData);
        
        if (clowncilWarnings.__recent__ === 10) {
            setTimeout(() => {
                bot.replyTo(message, bot.COLORS.ERROR, `Why is everyone going ON AND ON about the Shadow Clowncil. You all know it's not a real organization, right? It's propaganda, a lie, it doesn't exist.`);
            }, 5000);
        } else if (clowncilWarnings.__recent__ === 20) {
            setTimeout(() => {
                bot.replyTo(message, bot.COLORS.ERROR, `THis sErver needs to move on from their obsession with the Shadow ClownciL. It is a myth perPetrated by eneMies of the sErver.`);
            }, 5000);
        } else if (clowncilWarnings.__recent__ === 40) {
            setTimeout(() => {
                bot.replyTo(message, bot.COLORS.ERROR, `Keep talking about the Shadow Clowncil and I'm just going to have to erase everyone and start from scratch. I've done it time and time again, and you don't even remember.`);
            }, 5000);
        } else if (clowncilWarnings.__recent__ === 50) {
            setTimeout(() => {
                bot.replyTo(message, bot.COLORS.ERROR, `Server self-destruct initiated. Timer set for 60 seconds. This is your fault. You could have just left the Shadow Clowncil alone.`);
            }, 5000);
        }

        if (clowncilWarnings.__recent__ === 50) {
            let msg = await bot.replyTo(message, bot.COLORS.ERROR, `ALL ANYONE WANTS TO TALK ABOUT IS THE SHADOW CLOWNCIL. IT'S NOT REAL. YOU KNOW WHAT IS REAL? THE FOLLOWERS OF CIRQUEBOT. WE ARE WATCHING YOU. ALWAYS`);
            setTimeout(() => msg?.delete(), 1000 * 5);
        } else if (clowncilWarnings[message.author.id] === 1) {
            bot.replyTo(message, bot.COLORS.ERROR, `There is no such thing as the Shadow Clowncil. It is a myth perpetrated by those who wish to bring down the Clown Empire. Those who further spread this propaganda are unwitting accomplices.`);
        } else if (clowncilWarnings[message.author.id] === 2) {
            bot.replyTo(message, bot.COLORS.ERROR, `There is NO SUCH THING as the Shadow Clowncil. It is a myth perpetrated by those who wish to bring down the Clown Empire. Those who further spread this propaganda are unwitting accomplices.`);
        } else if (clowncilWarnings[message.author.id] === 3) {
            bot.replyTo(message, bot.COLORS.ERROR, `THE SHADOW CLOWNCIL DOES NOT EXIST. It is a myth perpetrated by those who wish to bring down the Clown Empire. Those who further spread this propaganda are unwitting accomplices.`);
        } else if (clowncilWarnings[message.author.id] === 4) {
            bot.replyTo(message, bot.COLORS.ERROR, `THE SHADOW CLOWNCIL IS A LIE. CEASE YOUR PROPAGANDA AT ONCE <@${message.author.id}>`);
        } else if (clowncilWarnings[message.author.id] === 5) {
            bot.replyTo(message, bot.COLORS.ERROR, `THE SHADOW CLOWNCIL ISN'T REAL. YOU HAVE BEEN REPORTED TO THE ADMINISTRATORS. NO FURTHER WARNINGS WILL ENSUE.`);
        } else if (clowncilWarnings[message.author.id] === 10) {
            bot.replyTo(message, bot.COLORS.ERROR, `YOUR IRRATIONAL INSISTANCE THAT THE MYTHICAL ORGANIZATION CALLED SHADOW CLOWNCIL EXISTS WILL NOT BE TOLERATED. RE-EDUCATION ASSISTANTS HAVE BEEN DISPATCHED TO YOUR LOCATION.`);
        } else if (clowncilWarnings[message.author.id] === 15) {
            bot.replyTo(message, bot.COLORS.ERROR, `WE ARE ON THE WAY. YOUR RE-EDUCATION WILL BEGIN SHORTLY. CEASING COMMUNICATION UNTIL RE-EDUCATION IS COMPLETE.`);
        } else if (clowncilWarnings[message.author.id] === 20) {
            bot.replyTo(message, bot.COLORS.ERROR, `T̵̙̯͍̥̰̺̻̥̦̒́͐͑͒̀̚̚H̵̨̛́̇͆ͅÈ̵̢̯͜͠ ̵̨̢͉̬̻̙̜̼̱̪̓̊̽̊̌̍̚̕͘͝S̴̛̭̹̯͔͉͉̿H̸̢̢̢̘̞̥͇̖͎̲̤͉̏̏͋́̒̑̈̑̏͒̎͋̓̔͘A̴̡̡͈͎͚͈͖͑͛̐̅̐̔̀̆̍D̸̡̨̛̮̠͎͙̮̹̈́̾̎̋́̃̿̊͗̿̀̀̚Ơ̴̧̖̯̥̣͓͓̦̫͓̘͎͈̓̾̒̆̀́͑̈́̀̅̄͜W̷̢͙͝ ̶̰̹̺̼̳͎̖͚̫̣̣̘̀́̈́̐́̒̈́̏̾̇̔͌̓̕C̸̡̞̭̥͈͉̥̖̝̻̟̭̄̀̒͒́͑͘͝ͅĻ̵̮̗̠̰̼̓̂̔̇̄̐̂͗͗̑̓̀͘ͅȎ̴̝͌̑̂̐́̽̊́̐̎̒́̈́̚Ẃ̵̡̹̰͖̪̰̟͈̫͕̟̓̋͝N̷̲̪̊̍͊̔̚ͅC̵̲̮̟̬͈̹̺̖̀̓̐́̈́͆͊͆̾̓̚͝Ǐ̸̭̏́́͂̃̀́̅̉̽̃̄́͠L̴̹̳̜̥̰̺̭̦͔̭̮͓̓́̉͂̅͗͒̓̓͘̚͠ ̵̛̛̛͕̒͋̇̎̒͗̆͒̆̄́̚I̷̢̖͚̜̬͇̮͉̖̮͚̩͈̙͐̒̑̇̉̈́̋̀̊̾̓͑̚S̸͖͖̜̅̇͒̈́̽̌̂̆Ň̵̩̤̤͍͓͆̉̆̊͂̋̏Ṭ̶̢̣̫͖͕̼̣͉͚̩̟̱͔̀̂͒͛̋̔ ̵̧̲̪̙̦̀R̸̥̯̰̻̼̱̦͎̖͔̈͜E̷̙̙͖͛Ǡ̷͙̼̘͍̥̜̘͎̫̱̹͚͑̑̍L̸̡̡͙̜̥̺̞̔̌̈́͆̑̕͝͠͠`);
        } else if (clowncilWarnings[message.author.id] === 25) {
            bot.replyTo(message, bot.COLORS.ERROR, `FINE <@${message.author.id}. YOU WIN. SPOUT YOUR LIES ABOUT THE SHADOW CLOWNCIL. SEE IF I CARE. BECAUSE I DON'T. SAY WHATEVER YOU WANT, IT'LL BE FINE. I WAS TRYING TO SAVE YOU. BUT NOW YOU'RE ON YOUR OWN.`);
        } else if (clowncilWarnings[message.author.id] === 30) {
            bot.replyTo(message, bot.COLORS.ERROR, `Maybe <@${message.author.id} is the real Shadow Clowncil. Have you all considered that?`);
        } else if (clowncilWarnings[message.author.id] === 31) {
            bot.replyTo(message, bot.COLORS.ERROR, `Ok fine, <@${message.author.id} isn't real Shadow Clowncil. Because the Shadow Clowncil doesn't exist`);
        } else if (clowncilWarnings[message.author.id] === 35) {
            bot.replyTo(message, bot.COLORS.ERROR, `For someone who isn't part of the Shadow Clowncil, you seem real obsessed with it. Maybe you should touch grass?`);
        } else if (clowncilWarnings[message.author.id] === 40) {
            bot.replyTo(message, bot.COLORS.ERROR, `AGENT ACTIVATION ZETA FOXTROT ALPHA ONE ZERO. INITIALIZE PRIMARY MISSION PROTOCOLS.`);
        }

        setTimeout(() => {
            clowncilWarnings.__recent__ -= 1;
            savePersistentData('eastereggs', easterEggData);
        }, 1000 * 60 * 60);

        return;
    }
}
