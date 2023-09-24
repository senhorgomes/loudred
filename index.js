const { token } = require('./config.json');
const { Client, Intents } = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus }= require('@discordjs/voice');



const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, "GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"],
});
const player = createAudioPlayer();

client.on("ready", () => {
  console.log("I'm online!")
})
let playlistQueue = [];

async function playSong(songTerm, messageHere, connector) {
  try {
    // let searchResult = await searcher.search(songTerm, { type: "video" })
    // console.log("firstUrl", searchResult.first.url)
    // let searchResultURL = searchResult.first.url;
    const video_finder = async (query) => {
      const videoResult = await ytSearch(query);
      return videoResult.videos[0];
    }
    const videoResult = await video_finder(songTerm);
    if (videoResult) {
      //videoresult.title and videoresult.url are the required to be added
      let newSongInQueue = {};
      if (playlistQueue.length >= 1) {
        newSongInQueue = {
          title: videoResult.title,
          url: videoResult.url
        }
        playlistQueue.push(newSongInQueue)
        messageHere.channel.send(`Added ${videoResult.url} to the playlist`)
      } else {
        const youtubeSong = ytdl(videoResult.url, {filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<25});
        newSongInQueue = {
          title: videoResult.title,
          url: videoResult.url
        }
        playlistQueue.push(newSongInQueue)
        const resource = createAudioResource(youtubeSong);
        player.play(resource)
        messageHere.channel.send(`Playing ${videoResult.url}`)
        player.on('error', error => {
          console.error(`Error: ${error.message} with resource`);
        });
        connector.subscribe(player)
      }
    }
  } finally {
    console.log("yay")

  }
}

client.on("messageCreate", (message) => {
  if (message.author.bot) return false;
  const voiceChannelThatUserIsIn = message.member.voice.channel;
  const userMessage = message.content;
  const prefix = '!';
  const youtubeSearchTerm = userMessage.split(' ').slice(1).join(' ');
  // const command = argss.shift().toLowerCase();
  console.log("ID HERE!!!", voiceChannelThatUserIsIn)
  const connection = joinVoiceChannel({
    channelId: voiceChannelThatUserIsIn.id,
    guildId: voiceChannelThatUserIsIn.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });
  if (userMessage.startsWith(prefix + "check playlist")) {
    let songPlace = 0;
    playlistQueue.forEach(song => {
      if(songPlace == 0) {
        message.channel.send(`Currently playing - ${song.title}`)
        songPlace ++
      } else {
        message.channel.send(`${songPlace} - ${song.title}`)
        songPlace ++
      }
    })
  }
  if (userMessage.startsWith(prefix + "play")) {
    playSong(youtubeSearchTerm, message, connection)
      .catch(error => console.log(error))
      .then(() => console.log("Playing Song"))
  }
  if (userMessage.startsWith(prefix + "pause")) {
    player.pause()
    message.channel.send("Music has been paused. Use command !resume to resume play.")
  }
  if (userMessage.startsWith(prefix + "resume")) {
    player.unpause()
    message.channel.send("Music has been resumed.")
  }
  if (userMessage.startsWith(prefix + "last")) {
    playlistQueue.pop()
  }
  if (userMessage.startsWith(prefix + "delete")) {
    const songPosition = userMessage.split(" ")[1];
    if (songPosition == 0) {
      message.channel.send("Sorry, that song is currently playing. Please use !skip")
    } else {
      message.channel.send(`Removing ${playlistQueue[songPosition].title} from the playlist.`)
      playlistQueue.splice(songPosition, 1);
    }
  }
  if (userMessage.startsWith(prefix + "stop")) {
    player.stop()
    playlistQueue = []
    message.channel.send("Music stopped and playlist cleared.")
  }
  if (userMessage.startsWith(prefix + "skip")) {
    player.stop()
    const youtubeSong = ytdl(playlistQueue[1].url, {filter: 'audioonly', highWaterMark: 1<<25});
    const resource = createAudioResource(youtubeSong);
    player.play(resource)
    message.channel.send(`Playing ${playlistQueue[1].url}`)
    player.on('error', error => {
      console.error(`Error: ${error.message} with resource`);
    });
    connection.subscribe(player)
    playlistQueue.splice(0, 1)
  }
  if (userMessage.startsWith(prefix + "commands")) {
    message.channel.send("Here are a list of commands:")
    message.channel.send("!play 'song title' : to play a song, or add a song to queue to the playlist if one is already playing")
    message.channel.send("!pause : to pause the music")
    message.channel.send("!resume : to resume playing of the music")
    message.channel.send("!stop : to stop music and clear the playlist")
    message.channel.send("!last : to delete the last song added to the playlist")
    message.channel.send("!delete num : replace num with the position number of the song to delete it")
    message.channel.send("!skip : to skip the current song playing")
    message.channel.send("!check playlist : to show the current playlist")
  }
  // [0]

  player.on(AudioPlayerStatus.Idle, () => {
    console.log("Before slicing", playlistQueue);
    if(playlistQueue.length > 1){
      const youtubeSong = ytdl(playlistQueue[1].url, {filter: 'audioonly', highWaterMark: 1<<25});
      const resource = createAudioResource(youtubeSong);
      player.play(resource)
      message.channel.send(`Playing ${playlistQueue[1].url}`)
      player.on('error', error => {
        console.error(`Error: ${error.message} with resource`);
      });
      connection.subscribe(player)
      playlistQueue.splice(0, 1)
      console.log(playlistQueue);
    } else {
      playlistQueue = []
    }
  });
});
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
    console.log(interaction)
  } else if (commandName === 'server') {
    await interaction.reply('Server info.');
  } else if (commandName === 'user') {
    await interaction.reply('User info.');
  }
});


client.login(token)