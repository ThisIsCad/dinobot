
const fs = require('fs');
import { TextBasedChannel } from 'discord.js';
import { log } from '../utils';
import { createEventEmbed, updateEventEmbeds } from './embeds';

export let events: { [eventId: string]: CircusEvent } = {};

if (fs.existsSync('data/events.json')) {
    const eventData = fs.readFileSync('data/events.json');
    events = JSON.parse(eventData);
}

export function findEvent(eventId: string): CircusEvent | null {
    eventId = (eventId || '').trim();

    if (events.hasOwnProperty(eventId)) {
        return events[eventId];
    }

    return Object.values(events).find(event => {
        return Object.values(event.published_channels).includes(eventId);
    }) || null;
}

export function saveEvents() {
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
}

export async function createEvent(channel: TextBasedChannel, event: CircusEvent) {
    const embed = createEventEmbed(event);
    let msg = await channel.send({ embeds: [embed] });

    log('info', `Event has been created by ${event.author} - Event ID is ${msg.id}`);
    event.id = msg.id;
    event.published_channels = { [channel.id]: msg.id };
    events[event.id] = JSON.parse(JSON.stringify(event));
    await updateEventEmbeds(event);
    saveEvents();

    await channel.send(`<:dinoez:1070750919978909806> <@${event.authorId}> Your event has been successfully created.\n\nEvents are closed by default. To open your event, use \`!open_event ${event.id}\`.\n\nYou may wish to publish this event to another channel before opening it.`);

    return null;
}

export async function updateEvent(eventId: string, event: Partial<CircusEvent>) {
    events[eventId] = Object.assign(events[eventId], event);
    saveEvents();
    updateEventEmbeds(events[eventId]);
}