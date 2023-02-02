DinoBot Readme
==============

Features
--------

### Raid Events

This feature is pretty specific to MMOs with the Tank/Healer/DPS roles. More flexibility *may* be added in the future. Events are created with an interactive wizard. For more info, use the `!event_help` command.

### Scheduled Threads

This feature allows a thread to be created in a designated channel, and archived every N days (regardless of activity). For example, a weekly discussion thread that gets archived every Monday.

### Removed User Log

Posts a message to the designated channel whenever a user leaves the server. Custom message if they left on their own, got kicked, or got banned. Shows kick/ban reasons, the date the user joined, their nickname when they left, and the roles they had before they left.

### Canned Replies

Allows users to collaboratively create and edit "canned replies" that can be reposted with the command name, e.g. `=parseinfo` might post the StarParse info for your guild. Use `=help` for more information.

Deployment
----------

The only prerequisite is having Docker installed, and grabbing the docker image (which you may have to build yourself, see below). In this example, I've copied the source code to `/usr/src/dinobot` on my server, and am using a mounted volume to persist data across container restarts:

```
docker run -itd -v /usr/src/dinobot:/usr/src/app -v /usr/src/dinobot:/usr/src/app dinobot
```

Configuration
-------------

Sample `config.json` file:

```
{
    "BOT_CLIENT_ID": "912376778939584562",
    "BOT_TOKEN": "YOUR_SECRET_BOT_TOKEN",
    "BOT_PREFIX": "!",
    "BOT_DEVS": [
        "200716538729201664",
        "261966268964274176",
        "170366327234494464",
        "363871296498696193",
        "912376778939584562"
    ],
    "PERMISSIONS": {
        "814616443919532062": ["*"],
        "730401144773410927": ["*"],
        "730432239325806632": ["event_help", "ping_event"]
    }
}
```

Permissions will eventually be incorporated into a configuration module that works with bot commands, but for now, is hard coded in the config file.

Adding The Bot To Your Server
-----------------------------

Authorization URL:

```
https://discord.com/api/oauth2/authorize?client_id=912376778939584562&permissions=1644388805842&scope=bot%20applications.commands
```

Development
-----------

Use Node.js 16 or higher.

```
npm install
npm run build; node .\cirque-bot.js
```

Building The Docker Image
-------------------------

**Linux:**

```
docker build -t dinobot .
docker run -itd -v /usr/src/dinobot/data:/usr/src/app/data -v /usr/src/dinobot:/usr/src/app dinobot
```
