import { Message } from "discord.js";
import { sendError, sendMessage } from "../utils/replies";
import { log } from "../utils/logging";
import { makeEmptyEvent } from "./default_event";
import { createEvent } from "./persistence";

const eventSessions: { [channelId: string]: CircusEvent } = { };

export function beginEventCreation(message: Message<boolean>, quick: boolean) {
    if (eventSessions.hasOwnProperty(message.channel.id)) {
        sendError(message.channel, "Another user is already in the process of creating an event. Please wait for them to finish.");
        return;
    }

    eventSessions[message.channel.id] = makeEmptyEvent();
    eventSessions[message.channel.id].serverId = message.guildId || '';
    eventSessions[message.channel.id].authorId = message.author.id;
    eventSessions[message.channel.id].author = `${message.author.tag} {${message.author.id}}`;
    eventSessions[message.channel.id].messageId = message.id;
    eventSessions[message.channel.id].quick_create = quick;
    log('info', `User ${message.author.tag} {${message.author.id}} is now creating an event`);

    if (message.content.includes('json')) {
        eventSessions[message.channel.id].step = 'json';
        sendMessage(message.channel, "Creating new event (Advanced Mode). Please enter the JSON for the event:");
    } else {
        eventSessions[message.channel.id].step = 'template';
        sendMessage(message.channel, "Creating new event. Please select a **Template** for the event (`swtor`, `lostark`, `scp`, or `generic`):");
    }
}

export function eventCreationHandler(message: Message<boolean>) {
    if (!eventSessions.hasOwnProperty(message.channel.id) || eventSessions[message.channel.id].authorId !== message.author.id) {
        return;
    }

    // TODO: Replace this with message collectors?

    const event = eventSessions[message.channel.id];

    if (message.id === event.messageId) {
        return; // Artifact of having multiple messageCreate event listeners
    } else if (message.content === 'cancel') {
        delete eventSessions[message.channel.id];
        return;
    } else if (message.content === 'debug') {
        sendMessage(message.channel, '```\n' + JSON.stringify(event, null, 2) + '\n```');
        return;
    }

    switch (event.step) {
        case 'json':
            eventSessions[message.channel.id] = JSON.parse(message.content);
            event.authorId = message.author.id;
            event.author = `${message.author.tag} {${message.author.id}}`;
            createEvent(message.channel, event);
            delete eventSessions[message.channel.id];
            break;
        case 'template':
            let template = message.content.trim();

            if (template === 'scp') template = 'scp_raid';
            if (template === 'lostark' || template === 'lost ark') template = 'lostark_raid';
            if (template === 'swtor') template = 'swtor_raid';
            if (template === 'event' || template === 'social' || template === 'generic') template = 'generic_event';

            if (template !== 'swtor_raid' && template !== 'generic_event' && template !== 'lostark_raid' && template !== 'scp_raid') {
                sendError(message.channel, 'Invalid template, please use one of `swtor`, `lostark`, `scp`, or `generic`');
                message.react('👎');
                return;
            }

            event.template = template;
            eventSessions[message.channel.id].step = 'title';

            if (template === 'scp_raid') {
                sendMessage(message.channel, "Please enter a **Title** for the event (e.g. \"Saturday Night SCP\"):");
            } else {
                sendMessage(message.channel, "Please enter a **Title** for the event (e.g. \"16p HM Revan (Pub Side)\"):");
            }
            
            break;
        case 'title':
            event.title = message.content;
            if (event.quick_create) { 
                event.step = 'date';
                sendMessage(message.channel, "Please enter the date for the event (using the format DD-MMM-YYYY, e.g. 03-Jan-2022):");
            } else {
                event.step = 'description';
                sendMessage(message.channel, "Please enter a **Description** for the event (or type '**next**' to skip):");
            }
            break;
        case 'description':
            event.description = message.content === 'next' ? null : message.content;
            event.step = 'date';
            sendMessage(message.channel, "Please enter the date for the event (using the format DD-MMM-YYYY, e.g. 03-Jan-2022):");
            break;
        case 'date':
            if (!message.content.match(/^[0-9]{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-202[2-9]$/i)) {
                sendError(message.channel, 'Invalid date or date format was given, please try again and __exactly match the format__ in the prompt (e.g. **01-Jan-2023** or **25-Jun-2023**) - ');
                message.react('👎');
                return;
            }
            
            let date = message.content.split('-');
            event.date = `${date[0]}-${date[1].substring(0, 3)}-${date[2]}`;
            event.step = 'time';
            sendMessage(message.channel, "Please enter the time for the event (e.g. 6:00 PM) - the time should be provided as EST and will be displayed in the user's timezone in Discord:");
            break;
        case 'time':
            if (message.content.match(/^([0-2]?[0-9]) ?(AM|PM)( [A-Z]{2,3})?$/i)) {
                message.content = message.content.replace(/^([0-2]?[0-9])/, '$1:00');
            }

            if (!message.content.match(/^([0-2]?[0-9]:[0-9]{2}) ?(AM|PM)( [A-Z]{2,3})?$/i)) {
                sendError(message.channel, 'Invalid time or time format was given, please try again');
                message.react('👎');
                return;
            }

            let time = message.content.replace(/ ?(AM|PM)/, ' $1');

            if (!time.match(/ [A-Z]{2,3}$/)) {
                event.time = time.toUpperCase() + ' EST';
            } else {
                event.time = time.toUpperCase();
            }

            if (event.template === 'swtor_raid') {
                event.step = 'tank_requirements';
                sendMessage(message.channel, "Please enter the requirements for Tanks to sign-up for this event (this will be shown in the description, e.g. \"Must have cleared in 8P\"):");
            } else if (event.template === 'scp_raid') {
                event.role_limits.group1 = -1;
                event.role_limits.group2 = 0;
                event.role_limits.group3 = 0;
                event.step = 'none';
                createEvent(message.channel, event);
                delete eventSessions[message.channel.id];
            } else if (event.template === 'generic_event' || event.template === 'lostark_raid') {
                event.step = 'group1_limit';
                sendMessage(message.channel, "Please enter the maximum number of attendees for group 1 (enter '0' to disable this group):");
            }

            break;
        case 'tank_requirements':
            event.role_requirements.tank = message.content;
            event.step = 'heal_requirements';
            sendMessage(message.channel, "Please enter the requirements for Healers to sign-up for this event (this will be shown in the description, e.g. \"Must have cleared in 8P and pull 10k EHPS\"):");
            break;
        case 'heal_requirements':
            event.role_requirements.healer = message.content;
            event.step = 'dps_requirements';
            sendMessage(message.channel, "Please enter the requirements for DPS to sign-up for this event (this will be shown in the description, e.g. \"Must have cleared in 8P and pull 15k DPS\"):");
            break;
        case 'dps_requirements':
            event.role_requirements.dps = message.content;
            if (event.quick_create) { 
                event.step = 'none';
                createEvent(message.channel, event);
                delete eventSessions[message.channel.id];
            } else {
                event.step = 'tank_limit';
                sendMessage(message.channel, "Please enter the number of Tanks spots for this event:");
            }
            break;
        case 'tank_limit':
            if (!message.content.match(/^[0-9]+$/i)) {
                sendError(message.channel, 'Invalid format, the entered value **must** be a number');
                message.react('👎');
                return;
            }

            event.role_limits.tank = parseInt(message.content);
            event.step = 'healer_limit';
            sendMessage(message.channel, "Please enter the number of Healer spots for this event:");
            break;
        case 'healer_limit':
            if (!message.content.match(/^[0-9]+$/i)) {
                sendError(message.channel, 'Invalid format, the entered value **must** be a number');
                message.react('👎');
                return;
            }

            event.role_limits.healer = parseInt(message.content);
            event.step = 'dps_limit';
            sendMessage(message.channel, "Please enter the number of DPS spots for this event:");
            break;
        case 'group1_limit':
            if (!message.content.match(/^-?[0-9]+$/i)) {
                sendError(message.channel, 'Invalid format, the entered value **must** be a number');
                message.react('👎');
                return;
            }

            event.role_limits.group1 = parseInt(message.content);
            event.step = 'group2_limit';
            sendMessage(message.channel, "Please enter the maximum number of attendees for group 2 (enter '0' to disable this group):");
            break;
        case 'group2_limit':
            if (!message.content.match(/^-?[0-9]+$/i)) {
                sendError(message.channel, 'Invalid format, the entered value **must** be a number');
                message.react('👎');
                return;
            }

            event.role_limits.group2 = parseInt(message.content);

            if (event.template === 'lostark_raid') {
                event.step = 'none';
                event.role_limits.group3 = 0;
                createEvent(message.channel, event);
                delete eventSessions[message.channel.id];
            } else {
                event.step = 'group3_limit';
                sendMessage(message.channel, "Please enter the maximum number of attendees for group 3 (enter '0' to disable this group):");
            }
            break;
        case 'group3_limit':
            if (!message.content.match(/^-?[0-9]+$/i)) {
                sendError(message.channel, 'Invalid format, the entered value **must** be a number');
                message.react('👎');
                return;
            }

            event.role_limits.group3 = parseInt(message.content);
            event.step = 'none';
            createEvent(message.channel, event);
            delete eventSessions[message.channel.id];
            break;
        case 'dps_limit':
            if (!message.content.match(/^[0-9]+$/i)) {
                sendError(message.channel, 'Invalid format, the entered value **must** be a number');
                message.react('👎');
                return;
            }

            event.role_limits.dps = parseInt(message.content);
            event.step = 'none';
            createEvent(message.channel, event);
            delete eventSessions[message.channel.id];
            break;
    }
}