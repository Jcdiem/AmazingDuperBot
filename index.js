const Discord = require('discord.js');
const CowSay = require('cowsay');
const client = new Discord.Client();
const token = require('./config.json');

client.once('ready', () => {
	console.log('Ready!');
});

client.login(token);


client.on('message', message => {
	if(message.content.substring(0, 1) === '&') {
		const commandPhrase = String(message.content);
		try{checkCommand(commandPhrase.substring(1), message.channel);}
		catch(err) {
			logError(1, err.message);
		}
	}
});

function checkCommand(command, channel) {
	let commandChk = String(command);
	commandChk = command.toLowerCase();


	// Help command
	if (commandChk.substr(0, 5) === 'help') {
		channel.send('Here are our current options for commands ```'
        + '\n 1. Cowsay --- &cowsay [words with spaces]'
        + '\n 2. Help   --- &help'
        + '```');
	}
	// Cowsay command
	else if (commandChk.substring(0, 6) === 'cowsay') {
		channel.send('```' + CowSay.say({
			text: command.substring(6),
		}) + '```');
	}
	// Command not found
	else{
		logError(0, 'Command ' + command + ' not in list');
	}
}


function logError(type, message) {
	switch(type) {
	// Warn
	case 0:
		console.log('WARNING: ' + message);
		break;

		// Error
	case 1:
		console.log('ERROR: ' + message);
		break;

		// Security violation
	case 2:
		console.log('SECURITY VIOLATION: ' + message);
		break;

	default:
		break;
	}
}