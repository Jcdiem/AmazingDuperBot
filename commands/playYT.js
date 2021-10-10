const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-yt')
        .setDescription('Play a video from youtube')
        .addStringOption(option => option.setName('ytlink').setDescription('Youtube link')),
    async execute(interaction) {
        await interaction.reply(`The link you requested was ${interaction.options.getString('ytlink')} \n and test string was`);
    },
};