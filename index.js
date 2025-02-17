const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
} = require("discord.js");
const {
  Guilds,
  GuildMembers,
  GuildMessages,
  GuildVoiceStates,
  MessageContent,
} = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;
const rconHandler = require("./Functions/rconHandler");
const fs = require('fs').promises;
const { execSync } = require('child_process');

const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, GuildVoiceStates, MessageContent],
  partials: [User, Message, GuildMember, ThreadMember],
});

const { loadEvents } = require("./Handlers/eventHandler");

client.config = require("./config.json");
client.events = new Collection();
client.commands = new Collection();

module.exports = client;

loadEvents(client);

let logined = false;
client.login(client.config.token).then(() => {
  logined = true;
})

let intervalId;

const whitelistCheck = async () => {
  try {
    // Read the configuration file to check the whitelist status
    const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));

    // Check if the whitelist is enabled
    if (config.whitelist_enabled) {
      await rconHandler.connect();

      try {
        const response = await rconHandler.sendCommand("ShowPlayers");

        const steamIdRegex = /\b(\d{17})\b/g;
        const steamIds = (response.match(steamIdRegex) || []).map(cleanId).map(String);

        const whitelistArray = (await fs.readFile('whitelist.txt', 'utf-8'))
          .split("\n")
          .map(cleanId)
          .filter(Boolean) // Remove empty strings
          .map(String); // Convert to strings

        const nonMatchingIds = steamIds.filter(obj => !whitelistArray.includes(obj.trim()));

        if (nonMatchingIds.length === 0) {
          console.log("All steamIds from steamIds match with whitelistArray.");
        } else {
          console.log("Not all steamIds from steamIds match with whitelistArray.");
          console.log("Non-matching steamIds:", nonMatchingIds);

          // Kick players with non-matching steamIds
          for (const nonMatchingNumber of nonMatchingIds) {
            await rconHandler.sendCommand(`KickPlayer ${nonMatchingNumber}`);
            console.log(`Kicking player with non-matching steamId: ${nonMatchingNumber}`);
          }
        }
      } catch (err) {
        console.log(`Error: ${err}`);
      } finally {
        rconHandler.disconnect();
      }
    } else {
      //console.log("Whitelist is disabled. Skipping whitelist check.");
    }
  } catch (err) {
    console.log(`Error reading config file: ${err}`);
  }
};

let noPlayerFrom = null;
let isOffline = false;

async function getPlayers(retry = 2) {
  try {
    await rconHandler.connect();
    const response = await rconHandler.sendCommand("ShowPlayers");
    const players = Math.max(parseInt(response.split("\n").length - 2), 0);
    return players;
  }
  catch (err) {
    console.error(err);
    if (retry > 0) {
      return getPlayers(retry - 1);
    }
    return 0;
  }
  finally {
    rconHandler.disconnect();
  }

}

const showPlayers = async () => {
  console.log("showPlayers");
  if (!logined) {
    return;
  }

  try {
    console.log("Checking server status");
    const players = await getPlayers();
    if (players > 0) {
      noPlayerFrom = null;
      console.log(`noPlayerFrom = null`);
    }
    else if (noPlayerFrom === null) {
      noPlayerFrom = new Date();
      console.log("No players, setting noPlayerFrom", noPlayerFrom);
    }

    console.log(noPlayerFrom, noPlayerFrom && (20 * 60 * 1000 + noPlayerFrom.getTime() - Date.now()))
    if (noPlayerFrom !== null && noPlayerFrom.getTime() < Date.now() - 20 * 60 * 1000) {
      console.log(`No players for 20 minutes, shutting down server. noPlayerFrom: ${noPlayerFrom}, now: ${Date.now()}`)
      const channel = client.channels.cache.get(config.notice_channel);
      channel.send("플레이어가 20분 동안 없어서 서버를 종료합니다. 플레이 하시려면 /start 명령어로 서버를 다시 시작해주세요.");
      const stdout = execSync(config.server_stop_command);
      console.log(stdout.toString());
    }

    if (isOffline) {
      isOffline = false;
    }

    const statusText = `${players}/32`;
    console.log(`Server is online, ${players} players are online`);
    client.user.setActivity(`Players: ${statusText}`, { type: ActivityType.Watching });
  }
  catch (err) {
    console.error(err);
    client.user.setActivity('Server: Offline', { type: ActivityType.Watching });
    console.log(`Server is offline, error: ${err}`);
    noPlayerFrom = null;
    isOffline = true;
  }
  finally {
    rconHandler.disconnect();
  }
};

// Run it once so it doesn't take 2 minutes for the status to appear
showPlayers();

// Player count check, every 2 minutes
intervalId = setInterval(showPlayers, 30 * 1000);

const cleanId = str => str.replace(/\D/g, '').trim(); // Trim whitespaces

// Whitelist check, every 5 minutes
intervalId = setInterval(whitelistCheck, 5 * 60 * 1000);
