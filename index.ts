import dotenv from "dotenv"
import * as fs from 'fs';
const { Shazam } = require("node-shazam")
import { Telegraf } from "telegraf"
import axios from "axios";

const SpotifyWebApi = require("spotify-web-api-node")

const request = require("request")
dotenv.config()

const chatIDs: number[] = []
const BOT_TOKEN = process.env.BOT_TOKEN
const shazam = new Shazam()

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const download = (url: string, path: string, callback: any) => {
    request.head(url, () => {
        request(url).pipe(fs.createWriteStream(path)).on('close', callback);
    });
};

async function getTrackInfo(trackId: string) {
    try {
        const trackData = await spotifyApi.getTrack(trackId);
        console.log('Track info:', trackData.body);
        return trackData.body;
    } catch (err) {
        console.error('Error fetching track info:', err);
    }
}

async function searchSpotify(query: string, type = 'track') {
    try {
        const response = await spotifyApi.search(query, [type], { limit: 10 }); // You can adjust the limit
        console.log(`Search results for "${query}":`);
        response.body.tracks.items.forEach((item: any, index: any) => {
            getTrackInfo(item.id)
            // console.log(`${index + 1}. ${item.name} by ${item.artists.map((artist: any) => artist.name).join(', ')}`);
        });
    } catch (error) {
        console.error('Error searching Spotify:', error);
    }
}



if (!BOT_TOKEN) {
    console.log("YOUR BOT TOKEN iSN'T VALID")
} else {

    const bot = new Telegraf(BOT_TOKEN)


    // Main Function
    // (async () => {
    //     await authenticateSpotify();
    //     const trackId = '3n3Ppam7vgaVa1iaRUc9Lp'; // Replace with a Spotify track ID
    //     const trackInfo = await getTrackInfo(trackId);
    //     console.log(`Track Name: ${trackInfo.name}`);
    //     console.log(`Artists: ${trackInfo.artists.map((artist: any) => artist.name).join(', ')}`);
    //     console.log(`Preview URL: ${trackInfo.preview_url}`);
    // })();

    // (async () => {
    //     const previewUrl = 'https://p.scdn.co/mp3-preview/...'; // Replace with a real preview URL
    //     await downloadPreview(previewUrl, 'preview.mp3');
    // })();

    bot.start((ctx: any) => {
        ctx.reply("Welcome to our bot!")
        if (!chatIDs.includes(ctx.update.message.chat.id)) {
            chatIDs.push(ctx.update.message.chat.id)
        }
    })


    bot.on("video", async (ctx: any) => {
        try {
            ctx.reply("⏳")
            const video_id = await ctx.telegram.getFile(ctx.update.message.video.file_id)
            const res = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${video_id.file_id}`
            );

            const res2 = await res.json();
            const filePath = res2.result.file_path;
            const downloadURL =
                `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;

            download(downloadURL, `./videos/${res2.result.file_id}.mp4`, async () => {
                const recognise = await shazam.recognise(`./videos/${res2.result.file_id}.mp4`)

                // Finds song by searching its name
                // const track = await shazam.search_music('en-US', 'GB', `G'animat Asl Wayne`, '1', '0')

                let title = recognise.track.title
                try {
                    const data = await spotifyApi.clientCredentialsGrant();
                    spotifyApi.setAccessToken(data.body['access_token']);
                    console.log('Successfully authenticated with Spotify API.');
                } catch (error) {
                    console.error('Error authenticating with Spotify API:', error);
                }
                searchSpotify(`${encodeURI(title)}`)
            })

            // try {
            //     const response = await axios.get('https://api.jamendo.com/v3.0/tracks', {
            //         params: {
            //             client_id: process.env.JAMENDO_CLIENT_ADI,
            //             name: title,
            //             limit: 1, // You can adjust the limit as needed
            //         },
            //     });
            //     console.log(response)
            // } catch (err: any) {
            //     console.error(err)
            // }
        } catch (error: any) {
            ctx.reply("Error occured while procesing the audio!")
            console.log(error)
        }

    })

    bot.launch()
}