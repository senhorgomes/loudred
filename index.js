const { token } = require('./config.json');
const { Client, Intents } = require('discord.js');
const ytdl = require('ytdl-core');
// const { YTSearcher } = require('ytsearcher');
const ytSearch = require('yt-search');
const { createAudioPlayer, createAudioResource, joinVoiceChannel }= require('@discordjs/voice');



const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, "GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"],
});
const player = createAudioPlayer();

client.on("ready", () => {
  console.log("I'm online!")
})

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
      const youtubeSong = ytdl(videoResult.url, {filter: 'audioonly', highWaterMark: 1<<25});
      const resource = createAudioResource(youtubeSong);
      player.play(resource)
      player.on('error', error => {
        console.error(`Error: ${error.message} with resource`);
    });    
    connector.subscribe(player)
    }
    // const youtubeSong = ytdl(searchResultURL, {filter: 'audioonly'});
    // const resource = createAudioResource(youtubeSong);
    // player.play(resource)
    // player.on('error', error => {
    //   console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
    // });    
    // connector.subscribe(player)

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
  
  const connection = joinVoiceChannel({
    channelId: voiceChannelThatUserIsIn.id,
    guildId: voiceChannelThatUserIsIn.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
  });
  if (userMessage.startsWith(prefix + "play")) {

    // const youtubeSong = ytdl(youtubeSearchTerm, {filter: 'audioonly'});
    // const resource = createAudioResource(youtubeSong);
    // player.play(resource)
    // connection.subscribe(player)

    playSong(youtubeSearchTerm, message, connection)
      .catch(error => console.log(error))
      .then(() => console.log("Playing Song"))

  }
  if (userMessage.startsWith(prefix + "stop")) {
    player.stop()
  }
  // console.log(`Message from ${message.author.username}: ${message.content}`);
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