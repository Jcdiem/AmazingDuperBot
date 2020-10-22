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
client.once('discconnect', () => {
	console.log('Disconnect!');
});
client.on('message', async message => {
	if(message.content.substring(0, 1) !== prefix) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	const serverQueue = queue.get(message.guild.id);

	// Command checking try statment
	try{
		let hasErrored = false;

		// Help command
		if (command === 'help') {
			message.channel.send('Here are our current options for commands ```'
        + '\n 1. Cowsay --- &cowsay [words with spaces] --- The one and only GNUow'
		+ '\n 2. Help   --- &help --- Will print this list'
		+ '\n 3. Ping   --- &ping --- Will give delay between response'
		+ '\n 4. Play/P --- &p &play --- Will play a youtube link'
		+ '\n 5. Queue/Q--- &q &queue --- Will show the queue of songs'
		+ '\n 6. Np     --- &np --- Will show what is currently playing'
		+ '\n 7. Stop   --- &stop --- Will stop playing music and leave channel'
        + '```');
		}

		// Cowsay command
		else if (command === 'cowsay') {
			message.channel.send('```' + CowSay.say({
				text: args,
			}) + '```');
		}

		// Ping command
		else if(command === 'ping') {
			const msg = await message.channel.send('Pinging...');
			msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
		}

		// Play song
		else if(command === 'play' || command === 'p') {
			if(String(args).substring(0, 9) === 'https://') {
				message.channel.send('**Error when playing song.** \n***Please make sure you are using an http or https youtube link*** \n'
				+ '```LINK EXMAPLE: https://www.youtube.com/watch?v=Yw6u6YkTgQ4 \n'
				+ 'youtu.be is also accepted ```');
				logError(0, 'Improper link (' + args + ') used with bot play command');
				hasErrored = true;
				return;
			}
			else{
				play(message, serverQueue);
			}
		}

		// Give queue
		else if(command === 'queue' || command === 'q') {
			// Check for an empty queue
			if (!serverQueue) {
				message.channel.send('No songs in queue!');
				hasErrored = true;
				return;
			}


			let songPrintout = '**List of songs** ```';
			let i;
			for(i = 0; i < serverQueue.songs.length; i++) {
				if(i === 0) {
					songPrintout += (i + 1) + '. ' + serverQueue.songs[i].title
					+ ' - Length: ' + (Math.floor(serverQueue.songs[i].length / 60)) + ':' + (serverQueue.songs[i].length % 60)
					+ ' - Currently playing'
					+ ' - Requested by (Placeholder)'
					+ ' \n';
				}
				else{
					songPrintout += (i + 1) + '. ' + serverQueue.songs[i].title
					+ ' - Length: ' + (Math.floor(serverQueue.songs[i].length / 60)) + ':' + (serverQueue.songs[i].length % 60)
					+ ' - Time until played: ' + Math.floor(getTimeUntilPlay(serverQueue, i) / 60) + ':' + (getTimeUntilPlay(serverQueue, i) % 60)
					+ ' - Requested by (Placeholder)'
					+ ' \n';
				}
			}


			message.channel.send(
				songPrintout
				+ '```');
		}

		// What is now playing?
		else if(command === 'np') {
			console.log('np ran');
			message.channel.send(
				serverQueue.songs[0].title
				+ ' - Length: ' + (Math.floor(serverQueue.songs[0].length / 60))
				+ ':' + (serverQueue.songs[0].length % 60)
				+ ' - Requested by (Placeholder)'
				+ ' \n');
		}

		// Stop command (clears queue and disconnects from channel)
		else if(command === 'stop') {
			serverQueue.connection.disconnect();
			queue.delete(message.guild.id);
			if(!(queue.get(message.guild.id))) {
				message.channel.send('Queue cleared properly and left channel.');
			}
			else{
				message.channel.send('Queue has not been cleared : (');
				logError(2, 'Queue was not deleted for guild ID ' + message.channel.guild.id);
			}
		}

		// Command not found
		else if (hasErrored === false) {
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
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		length: songInfo.videoDetails.lengthSeconds,
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
		console.log('NOTICE: ' + message);
		break;

		// Error
	case 1:
		console.log('ERROR: ' + message);
		break;

	default:
		break;
	}
}

function getTimeUntilPlay(sQueue, i) {
	let runningTime = Number(0);
	let j;

	for (j = 0; j < i; j++) {
		runningTime += Number(sQueue.songs[j].length);
	}

	return runningTime;
}

client.login(config.token);