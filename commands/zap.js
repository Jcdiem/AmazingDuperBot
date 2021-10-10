const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zap')
        .setDescription('Replies with zoop!'),
    async execute(interaction) {
        await interaction.reply('zoop');
    },
};