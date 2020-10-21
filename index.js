const Discord = require('discord.js');
const CowSay = require('cowsay');
const client = new Discord.Client();
const config = require('./config.json');
const prefix = config.prefix;
const ytdl = require('ytdl-core');

const queue = new Map();

client.once('ready', () => {
	console.log(`I am ready! I am in ${client.guilds.size} guilds`);

	client.user.setActivity('with chimkens');
});
client.once('reconnecting', () => {
	console.log('Reconnecting!');
});
client.once('disc onnect', () => {
	console.log('Disconnect!');
});
client.on('message', async message => {
	if(message.content.substring(0, 1) !== prefix) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	const serverQueue = queue.get(message.guild.id);
	// console.log(serverQueue);

	// Error logging stuff
	// console.log(message.member.voice.channel);

	// Command checking try statment
	try{
	// Help command
		if (command === 'help') {
			message.channel.send('Here are our current options for commands ```'
        + '\n 1. Cowsay --- &cowsay [words with spaces] --- The one and only GNUow'
		+ '\n 2. Help   --- &help --- Will print this list'
		+ '\n 3. Ping 	--- &ping --- Will give delay between response'
        + '```');
		}
		// Cowsay command
		else if (command === 'cowsay') {
			message.channel.send('```' + CowSay.say({
				text: args,
			}) + '```');
		}
		// Ping command
		if(command === 'ping') {
			const msg = await message.channel.send('Pinging...');
			msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
		}
		// Play song
		if(command === 'play') {
			play(message, serverQueue);
		}
		// Command not found
		else{
			logError(0, 'Command ' + command + ' not in list');
		}
	}
	catch(err) {
		logError(1, err.message);
	}
});

async function play(message, serverQueue) {
	const args = message.content.split(' ');

	const voiceChannel = message.member.voice.channel;

	if(!voiceChannel) return message.reply('You must be in a voice channel!');

	const permission = voiceChannel.permissionsFor(message.client.user);
	if(!permission.has('CONNECT') || !permission.has('SPEAK')) {
		return message.channel.send('I need permission to join and speak in your voice channel!');
	}

	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
		title: songInfo.title,
		url: songInfo.video_url,
	};

	if(!serverQueue) {
		const queueConstruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
		queue.set(message.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try{
			const connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			playSong(message.guild, queueConstruct.songs[0]);
		}
		catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send('There was an error playing! ' + err);
		}
	}
	else {
		serverQueue.songs.push(song);
		return message.channel.send(`${song.title} has been added to the queue!`);
	}
}

function playSong(guild, song) {
	const serverQueue = queue.get(guild.id);
	console.log(serverQueue);

	if(!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection.play(ytdl(song.url))
		.on('end', () => {
			serverQueue.songs.shift();
			playSong(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.log(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
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

client.login(config.token);