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

client.login(client.config.token);

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

const showPlayers = async () => {
  try {
    const { GameDig } = await import('gamedig');
    const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));

    GameDig.query({
      type: 'palworld',
      host: config.host,
      port: config.port,
      givenPortOnly: true
    })
      .then((state) => {
        const players = Number(state.raw.attributes.PLAYERS_l);
        if (players > 0) {
          noPlayerFrom = null;
          console.log(`Server is online, ${players} players are online`);
        }
        else if (noPlayerFrom === null) {
          noPlayerFrom = new Date();
          console.log("No players, setting noPlayerFrom", noPlayerFrom);
        }

        if (noPlayerFrom !== null && noPlayerFrom.getTime() < Date.now() - 20 * 60 * 1000) {
          console.log(`No players for 20 minutes, shutting down server. noPlayerFrom: ${noPlayerFrom}, now: ${Date.now()}`)
          const channel = client.channels.cache.get(config.notice_channel);
          channel.send("플레이어가 20분 동안 없어서 서버를 종료합니다. 플레이 하시려면 /start 명령어로 서버를 다시 시작해주세요.");
          const stdout = execSync(config.server_shutdown_command);
          console.log(stdout.toString());
        }
        const statusText = `${players}/${state.raw.settings.maxPublicPlayers}`;
        client.user.setActivity(`Players: ${statusText}`, { type: ActivityType.Watching });
      })
      .catch((error) => {
        client.user.setActivity('Server: Offline', { type: ActivityType.Watching });
        console.log(`Server is offline, error: ${error}`);
        noPlayerFrom = null;
      });
  } catch (err) {
    console.log(`Error: ${err}`);
  }
};

// Run it once so it doesn't take 2 minutes for the status to appear
showPlayers();

// Player count check, every 2 minutes
intervalId = setInterval(showPlayers, 30 * 1000);

const cleanId = str => str.replace(/\D/g, '').trim(); // Trim whitespaces

// Whitelist check, every 5 minutes
intervalId = setInterval(whitelistCheck, 5 * 60 * 1000);
