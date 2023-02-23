import { Client, MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { messageUser } from '../utils/replies';
import { log } from '../utils/logging';
import { queueEventUpdate } from './embeds';
import { events, saveEvents } from './persistence';

let userRateLimits = { 
    'all': {},
    '<:tank:1078354357046747238>': {},
    '<:healer:1078354484973015171>': {},
    '<:dps:1078354427469123584>': {},
    '💙': {},
    '💚': {},
    '❤️': {},
    '✅': {},
    '1️⃣': {},
    '2️⃣': {},
    '3️⃣': {},
    '❓': {},
    '⌚': {},
    '❌': {},
 };
 let pendingUserUpdates = { 
     '<:tank:1078354357046747238>': {},
     '<:healer:1078354484973015171>': {},
     '<:dps:1078354427469123584>': {},
     '💙': {},
     '💚': {},
     '❤️': {},
     '✅': {},
     '1️⃣': {},
     '2️⃣': {},
     '3️⃣': {},
     '❓': {},
     '⌚': {},
     '❌': {},
};

export function registerEventReactions(client: Client) {
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot || !pendingUserUpdates.hasOwnProperty(reaction.emoji.toString())) {
            return;
        }

        if (reaction.partial) {
            reaction = await reaction.fetch();
        }
        
        const event = Object.values(events).find(x => x.id === reaction.message.id || Object.values(x.published_channels).includes(reaction.message.id));
        const emoji = reaction.emoji.toString();

        if (!event) return;
    
        // console.log(`REACTION ON EVENT ${reaction.message.id} : '${reaction.emoji.toString()}'`);

        if (pendingUserUpdates[emoji].hasOwnProperty(user.id)) {
            return;
        }
        if (!userRateLimits[emoji].hasOwnProperty(user.id)) {
            userRateLimits[emoji][user.id] = 0;
        }
        if (!userRateLimits.all.hasOwnProperty(user.id)) {
            userRateLimits.all[user.id] = 0;
        }

        if (userRateLimits[emoji][user.id] >= 3 || userRateLimits.all[user.id] >= 15) {
            log('info', `  Received reaction from rate-limited user ${user.tag} on event ${event.id} (${event.title}), ignoring`);
            return;
        }
    
        userRateLimits[emoji][user.id] += 1;
        userRateLimits.all[user.id] += 1;
        setTimeout(() => {
            userRateLimits[emoji][user.id] -= 1;
            userRateLimits.all[user.id] -= 1;

            if (userRateLimits[emoji][user.id] === 0) {
                reaction.users.remove(user.id);
            }
        }, 25000)

        pendingUserUpdates[emoji][user.id] = true;
        await handleReactionAdd(event, emoji, reaction, user);
        await handleGenericEventReactionAdd(event, emoji, reaction, user);
        await queueEventUpdate(event);
        saveEvents();
        delete pendingUserUpdates[emoji][user.id];
        reaction.users.remove(user.id);
    });
}

async function getDisplayName(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (!reaction.message.guild) {
        return user.tag || user.id;
    }

    return (await reaction.message.guild?.members.fetch(user.id)).displayName || user.tag || user.id;
}

async function handleGenericEventReactionAdd(event: CircusEvent, emoji: string, reaction: MessageReaction, user: User | PartialUser) {
    if (event.signup_status === 'closed') {
        reaction.users.remove(user.id);
        log('debug', `Received reaction from ${user.tag} on closed event ${event.id} (${event.title})`);
        return;
    }

    const exclusiveRoles = {
        '1️⃣': 'group1',
        '2️⃣': 'group2',
        '3️⃣': 'group3',
        '✅': 'group1',
        '❓': 'tentative',
        '⌚': 'waitlist',
        '❌': 'notgoing',
    };

    if (exclusiveRoles.hasOwnProperty(emoji)) {
        let role = exclusiveRoles[emoji];

        if (event.signups[role].hasOwnProperty(user.id)) {
            log('info', `${user.tag} has removed themself as '${role}' for event ${event.id} (${event.title})`);
            delete event.signups[role][user.id];
            return;
        } else if (Object.values(event.signups[role]).length >= event.role_limits[role] && event.role_limits[role] >= 0) {
            log('info', `  Unable to sign-up ${user.tag} as '${role}' for event ${event.id} - '${role}' spots are full`);
            messageUser(user, `<:error:1078359607329706014> Sorry, '${role}' sign-ups for ${event.title} are currently full.`);
            return;
        }

        let logMsg = `${user.tag} has added themself as '${role}' for event ${event.id} (${event.title})`;

        Object.keys(event.signups).forEach(r => {
            if (event.signups[r].hasOwnProperty(user.id)) {
                logMsg = `${user.tag} has changed their signup from '${r}' to '${role}' for event ${event.id} (${event.title})`;
                delete event.signups[r][user.id];
            }
        });

        log('info', logMsg);
        event.signups[role][user.id] = await getDisplayName(reaction, user);
    }
}

async function handleReactionAdd(event: CircusEvent, emoji: string, reaction: MessageReaction, user: User | PartialUser) {
    if (event.signup_status === 'closed') {
        reaction.users.remove(user.id);
        log('debug', `Received reaction from ${user.tag} on closed event ${event.id} (${event.title})`);
        return;
    }
    
    if (emoji === '<:tank:1078354357046747238>') {
        if (event.signups.tanks.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Tank for event ${event.id} (${event.title})`);
            delete event.signups.tanks[user.id];
            return;
        } else if (Object.values(event.signups.tanks).length >= event.role_limits.tank) {
            log('info', `  Unable to sign-up user ${user.tag} as a Tank for event ${event.id} - Tank spots are full`);
            messageUser(user, `<:error:1078359607329706014> Sorry, tank sign-ups for ${event.title} are currently full. Please consider signing up for another role, or as a sub instead`);
            return;
        }

        if (event.signups.dps.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a DPS for event ${event.id} (${event.title})`);
            delete event.signups.dps[user.id];
        } else if (event.signups.healers.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Healer for event ${event.id} (${event.title})`);
            delete event.signups.healers[user.id];
        } 

        log('info', `User ${user.tag} has added themself as a Tank for event ${event.id} (${event.title})`);
        event.signups.tanks[user.id] = await getDisplayName(reaction, user);
    } else if (emoji === '<:dps:1078354427469123584>') {
        if (event.signups.dps.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a DPS for event ${event.id} (${event.title})`);
            delete event.signups.dps[user.id];
            return;
        } else if (Object.values(event.signups.dps).length >= event.role_limits.dps) {
            log('info', `  Unable to sign-up user ${user.tag} as a DPS for event ${event.id} - DPS spots are full`);
            messageUser(user, `<:error:1078359607329706014> Sorry, DPS sign-ups for ${event.title} are currently full. Please consider signing up for another role, or as a sub instead`);
            return;
        }

        if (event.signups.tanks.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Tank for event ${event.id} (${event.title})`);
            delete event.signups.tanks[user.id];
        } else if (event.signups.healers.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Healer for event ${event.id} (${event.title})`);
            delete event.signups.healers[user.id];
        } 

        log('info', `User ${user.tag} has added themself as a DPS for event ${event.id} (${event.title})`);
        event.signups.dps[user.id] = await getDisplayName(reaction, user);
    } else if (emoji === '<:healer:1078354484973015171>') {
        if (event.signups.healers.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Healer for event ${event.id} (${event.title})`);
            delete event.signups.healers[user.id];
            return;
        } else if (Object.values(event.signups.healers).length >= event.role_limits.healer) {
            log('info', `  Unable to sign-up user ${user.tag} as a Healer for event ${event.id} - Healer spots are full`);
            messageUser(user, `<:error:1078359607329706014> Sorry, healer sign-ups for ${event.title} are currently full. Please consider signing up for another role, or as a sub instead`);
            return;
        }

        if (event.signups.tanks.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Tank for event ${event.id} (${event.title})`);
            delete event.signups.tanks[user.id];
        } else if (event.signups.dps.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a DPS for event ${event.id} (${event.title})`);
            delete event.signups.dps[user.id];
        } 

        log('info', `User ${user.tag} has added themself as a Healer for event ${event.id} (${event.title})`);
        event.signups.healers[user.id] = await getDisplayName(reaction, user);
    } else if (emoji === '💙') {
        if (event.signups.tank_subs.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Tank Sub for event ${event.id} (${event.title})`);
            delete event.signups.tank_subs[user.id];
        } else {
            log('info', `User ${user.tag} has added themself as a Tank Sub for event ${event.id} (${event.title})`);
            event.signups.tank_subs[user.id] = await getDisplayName(reaction, user);
        }
    } else if (emoji === '💚') {
        if (event.signups.healer_subs.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a Healer Sub for event ${event.id} (${event.title})`);
            delete event.signups.healer_subs[user.id];
        } else {
            log('info', `User ${user.tag} has added themself as a Healer Sub for event ${event.id} (${event.title})`);
            event.signups.healer_subs[user.id] = await getDisplayName(reaction, user);
        }
    } else if (emoji === '❤️') {
        if (event.signups.dps_subs.hasOwnProperty(user.id)) {
            log('info', `User ${user.tag} has removed themself as a DPS Sub for event ${event.id} (${event.title})`);
            delete event.signups.dps_subs[user.id];
        } else {
            log('info', `User ${user.tag} has added themself as a DPS Sub for event ${event.id} (${event.title})`);
            event.signups.dps_subs[user.id] = await getDisplayName(reaction, user);
        }
    }

}