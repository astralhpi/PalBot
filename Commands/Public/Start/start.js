const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const { execSync } = require('child_process');

const config = require("../../../config.json")

module.exports = {

  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('서버를 켭니다.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("서버를 켰습니다.")
      .setDescription("1~2분 후에 서버가 온라인 상태로 변경됩니다. 몽마둥이 상태를 확인해주세요.")
    const stdout = execSync(config.server_start_command)
    console.log(stdout.toString())
    interaction.reply({ embeds: [embed] });
  },
};

function format_time(s) {
  return new Date(s * 1e3).toISOString().slice(-13, -5);
}
