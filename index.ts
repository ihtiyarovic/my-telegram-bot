import dotenv from "dotenv"
import * as fs from 'fs';
import path from "path"
const { Shazam } = require("node-shazam")
import { Telegraf } from "telegraf"
import axios from "axios";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg"


const request = require("request")
dotenv.config()

const chatIDs: number[] = []
const BOT_TOKEN = process.env.BOT_TOKEN
const shazam = new Shazam()
const youtube_api_key = process.env.youtube_api_key || "AIzaSyCG4zqP90ylR_u-1e-7Ze6JDfpsCSW3rak"
let videID = ''
let title = ""

const download = (url: string, path: string, callback: any) => {
    request.head(url, () => {
        request(url).pipe(fs.createWriteStream(path)).on('close', callback);
    });
};

async function downloadAudio(videoUrl: string, outputFile: string) {
    try {
        if (!ytdl.validateURL(videoUrl)) {
            console.error('Invalid YouTube URL.');
            return;
        }

        console.log('Starting video download...');

        // Create a writable stream to save the video
        const videoStream = ytdl(videoUrl, {
            quality: 'highestaudio', // Choose the best available quality
            filter: "audioonly",
        });

        console.log(videoStream)

        const writeStream = fs.createWriteStream(outputFile);

        // Pipe the video stream into the write stream
        videoStream.pipe(writeStream);

        // Listen for completion
        writeStream.on('finish', () => {
            console.log(`Video downloaded and saved as ${outputFile}`);
        });

        // Listen for errors
        videoStream.on('error', (err) => {
            console.error('Error downloading video:', err.message);
        });
        writeStream.on('error', (err) => {
            console.error('Error saving video:', err.message);
        });
    }
    catch (err: any) {
        console.error('Error:', err.message);

    };
}

if (!BOT_TOKEN) {
    console.log("YOUR BOT TOKEN iSN'T VALID")
} else {
    const bot = new Telegraf(BOT_TOKEN)


    bot.start((ctx) => {
        ctx.reply("Welcome to our bot!")

        // axios.request(options).then(res => {
        //     console.log(res)
        // }).catch(error => {
        //     console.error(error)
        // })

        if (!chatIDs.includes(ctx.update.message.chat.id)) {
            chatIDs.push(ctx.update.message.chat.id)
        }
    })

    bot.on("video", async (ctx) => {
        try {

            const video_id = await ctx.telegram.getFile(ctx.update.message.video.file_id)
            const res = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${video_id.file_id}`
            );

            const res2 = await res.json();
            const filePath = res2.result.file_path;

            const downloadURL =
                `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;


            download(downloadURL, path.join('./videos/', `${video_id.file_id}.mp4`), async () => {
                const recognise = await shazam.recognise(`./videos/${video_id.file_id}.mp4`)
                if (!recognise) {
                    ctx.reply("Unfortunately, we couldn't find your song!")
                } else {
                    title = recognise.track.title
                    const query = `${recognise.track.title} ${recognise.track.subtitle} official audio`;

                    axios.get(`https://youtube.googleapis.com/youtube/v3/search?key=${youtube_api_key}`, {
                        params: {
                            key: youtube_api_key,
                            part: "snippet",
                            q: encodeURIComponent(query)
                        }
                    }).then((res) => {
                        videID = res.data.items[0].id.videoId
                        const videoUrl = `https://www.youtube.com/watch?v=${videID}`;
                        downloadAudio(videoUrl, `./${title}.mp3`)
                    })

                }
            }
            );
        } catch (error: any) {
            ctx.reply("Error occured while procesing the audio!")
            console.log(error)
        }

    })

    bot.launch()
}