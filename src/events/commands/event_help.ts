import { MessageEmbed } from 'discord.js';
import { bot } from '../../bot';
import { EMBED_ERROR_COLOR, EMBED_INFO_COLOR, sendReply } from '../../utils';

bot.registerCommand('event_help', ['events', 'event'], interaction => {
    let helpMsg = 'Create and manage sign-ups for scheduled events like raids/operations/social events.\n\n';

    if (bot.checkPermissions('create_event', interaction.channel)) {
        helpMsg += "🗓️ `create_event`\nBegin creating a new event. You will be prompted for the event parameters.\n**Example:** `!create_event`\n\n";
    }
    if (bot.checkPermissions('create_event', interaction.channel)) {
        helpMsg += "⏲️ `quick_create`\nBegin creating a new event (using streamlined defaults). Only one event may be created at a time.\n**Example:** `!quick_create`\n\n";
    }
    if (bot.checkPermissions('edit_event', interaction.channel)) {
        helpMsg += "📝 `edit_event <EVENT_ID> <EVENT_FIELD> <NEW_VALUE>`\nEdit a field/option for an existing event. Only one field can be edited at a time.\n**Example:** `!edit_event 123456789 tank_requirements Previous tank clear required`\n\n";
    }
    if (bot.checkPermissions('export_event', interaction.channel)) {
        helpMsg += "📧 `export_event <EVENT_ID>`\nExport the JSON for an event (useful for troubleshooting or recreating an event)\n**Example:** `!export_event 123456789`\n\n";
    }
    if (bot.checkPermissions('open_event', interaction.channel)) {
        helpMsg += "🔓 `open_event <EVENT_ID> <TIME*>`\nOpen an event to allow sign-ups (reaction emojis will be added to the post - it may take a few seconds to update all published posts). Optionally specify a time to schedule when to open the event for sign-ups.\n**Example:** `!open_event 123456789 7:30 PM`\n\n";
    }
    if (bot.checkPermissions('close_event', interaction.channel)) {
        helpMsg += "🔒 `close_event <EVENT_ID>`\nClose an event to prevent sign-ups (reaction emojis will be removed from the post)\n**Example:** `!close_event 123456789`\n\n";
    }
    if (bot.checkPermissions('event_adduser', interaction.channel)) {
        helpMsg += "🏃 `event_adduser <EVENT_ID> <ROLE> <USER> <NOTES>`\nAdd a user to the sign-ups (roles are tank/healer/dps). Notes appear next to the username. The USER must be a MENTION.\n**Example:** `!event_adduser 123456789 tank @Cad#1234 (Titax)`\n\n";
    }
    if (bot.checkPermissions('event_removeuser', interaction.channel)) {
        helpMsg += "🚪 `event_removeuser <EVENT_ID> <ROLE> <USER>`\nRemove a user from the sign-ups (roles are tank/healer/dps). The USER must be a mention.\n**Example:** `!event_removeuser 123456789 tank @Cad#1234`\n\n";
    }
    if (bot.checkPermissions('ping_event', interaction.channel)) {
        helpMsg += "🔔 `ping_event <EVENT_ID> <TARGET_CHANNEL> <MESSAGE>`\nPing all signed up users (non-subs) with a custom message (e.g. to inform them you are forming up). The channel should be a channel mention not regular text.\n**Example:** `!ping_event 123456789 #lfg-groupfinder Now forming up pubside, please whisper Cadriel or x in allies`\n\n";
    }
    if (bot.checkPermissions('publish_event', interaction.channel)) {
        helpMsg += "🌎 `publish_event <EVENT_ID> <TARGET_CHANNEL>`\nPublish the event to the specified channel. All published events are sychronized. The channel must be a mention.\n**Example:** `!publish_event 123456789 #event-signups`\n\n";
    }
    if (bot.checkPermissions('list_events', interaction.channel)) {
        helpMsg += "📆 `list_events`\nList all upcoming events in the current channel. Pass the 'all' parameter to list previous events as well.\n**Example:** `!list_events`\n\n";
    }
    if (bot.checkPermissions('rebuild_event', interaction.channel)) {
        helpMsg += "🔄 `rebuild_event`\nRe-render the event post across all channels (e.g. if the template has changed or the post has somehow become desynced).\n**Example:** `!rebuild_event 123456789`\n\n";
    }
    if (bot.checkPermissions('repost_event', interaction.channel)) {
        helpMsg += "🔁 `repost_event`\nRe-post the event in the specified channel as a new message (e.g. if you want to repost it at the bottom of a channel for previewing it). The old message in the channel will no longer be updated.\n**Example:** `!repost_event 123456789 #schedule-planning`\n\n";
    }

    if (!helpMsg) {
        bot.replyTo(interaction, EMBED_ERROR_COLOR, "There are no commands whitelisted for this channel");
        return;
    }   
    
    const embed = new MessageEmbed().setTitle('DinoBot Help: ​ ​ `!events`').setDescription(helpMsg)
    bot.replyTo(interaction, EMBED_INFO_COLOR, embed);
});
