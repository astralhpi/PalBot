const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

const config = require("../../../config.json")

module.exports = {

  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('현재 서버 정보를 가져옵니다.'),

  async execute(interaction) {

    const { GameDig } = await import('gamedig')

    GameDig.query({
      type: 'palworld',
      host: config.host,
      port: config.port,
      givenPortOnly: true
    }).then((state) => {
      const exampleEmbed = new EmbedBuilder()
        .setColor(0xfff200)
        .setTitle(`서버 정보`)
        .addFields(
          { name: '**서버 상태**', value: `Online`, inline: true },
          { name: '**서버 주소**', value: `${config.host}:${config.port}`, inline: true },
          { name: '**플레이어**', value: `${state.raw.attributes.PLAYERS_l}/${state.raw.settings.maxPublicPlayers}`, inline: true },
          { name: '**경과한 일 수**', value: `${state.raw.attributes.DAYS_l}`, inline: true },
          { name: '**버전**', value: `${state.raw.attributes.VERSION_s}`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Based on PalBot Made by Lysec' })
        .setURL('https://github.com/Ly-sec/PalBot');

      interaction.reply({ embeds: [exampleEmbed] });
    }).catch((error) => {
      console.log(`Server is offline, error: ${error}`)
      const exampleEmbed = new EmbedBuilder()
        .setColor(0xfff200)
        .setTitle(`서버 정보`)
        .addFields(
          { name: '**서버 상태**', value: `Offline`, inline: true },
          { name: '**서버 주소**', value: `${config.host}:${config.port}`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Based on PalBot Made by Lysec' })
        .setURL('https://github.com/Ly-sec/PalBot');

      interaction.reply({ embeds: [exampleEmbed] });

    })

  },
};

function format_time(s) {
  return new Date(s * 1e3).toISOString().slice(-13, -5);
}
