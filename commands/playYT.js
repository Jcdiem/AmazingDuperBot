const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-yt')
        .setDescription('Play a video from youtube')
        .addStringOption(option => option.setName('ytlink').setDescription('Youtube link'))
};