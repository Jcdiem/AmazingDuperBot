const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.login('NzY2NDQzNTE2ODQ2MDE0NDY0.X4jcJg.tg31tdm2RmLcp-r1R-FokkNs0xg');


client.on('message', message => {
    if(message.channel == 764168918750330931){
        console.log("User: "+message.client+" Message: "+ message.content)
    }
});