import https from "https"
import dotenv from "dotenv"
import fs from "fs"
const acrcloud = require("acrcloud")
import { Telegraf } from "telegraf"
import axios from "axios"
dotenv.config()

const chatIDs: number[] = []
const BOT_TOKEN = process.env.BOT_TOKEN
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

const acr = new acrcloud({
    host: process.env.ACR_HOST,
    access_key: process.env.ACR_ACCESS_KEY,
    access_secret: process.env.ACR_ACCESS_SECRET
});



if (!BOT_TOKEN) {
    console.log("YOUR BOT TOKEN ISN'T WORKING")
} else {

    const bot = new Telegraf(BOT_TOKEN)
    bot.start((ctx) => {
        ctx.reply("Welcome to our bot!")
        if (!chatIDs.includes(ctx.update.message.chat.id)) {
            chatIDs.push(ctx.update.message.chat.id)
        }

    })

    bot.on("video", (ctx) => {

        try {
            const videoID = ctx.update.message.video.file_id
            ctx.telegram.getFileLink(videoID).then(async (link) => {
                https.get(link, (response) =>
                    response.pipe(fs.createWriteStream(`./temp/${videoID}.mp4`))
                );

                const recognizeAudio = async (sample: string) => {
                    try {

                        const path = fs.readFileSync(`./temp/${videoID}.mp4`)

                        const response = await acr.identify(path);

                        if (response.status.code === 0) {
                            console.log('Recognized:', response.metadata.music[0]);
                            getShazamDetails(response.metadata.music[0].artists[0].name,
                                response.metadata.music[0].title).then((track) => {
                                    if (track) {
                                        console.log("Track found:", track);
                                    } else {
                                        console.log("Track not found.");
                                    }
                                });
                        } else {
                            console.log('Recognition failed:', response.status.msg);
                        }
                    } catch (error: any) {
                        console.error('Error:', error.message);
                    }
                };
                recognizeAudio(`./songs/${videoID}`)
            });
        } catch (error) {
            ctx.reply("Unable to find the song")
            console.log(error)
        }

    })


    bot.launch()
}


// Replace with your RapidAPI key

async function getShazamDetails(artist: string, title: string) {
    const query = `${title} ${artist}`;
    const options = {
        method: "GET",
        url: "https://shazam.p.rapidapi.com/search",
        params: { term: query, locale: "en-US", offset: "0", limit: "1" },
        headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "shazam.p.rapidapi.com",
        },
    };

    try {
        const response = await axios.request(options);
        const track = response.data.tracks?.hits[0]?.track;

        if (!track) {
            console.log("No results found.");
            return null;
        }

        return track;
    } catch (error: any) {
        console.error("Error fetching Shazam data:", error.message);
        return null;
    }
}