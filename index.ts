import dotenv from "dotenv"
import * as fs from 'fs';
import path from "path"
const { Shazam } = require("node-shazam")
import { Telegraf } from "telegraf"
import axios from "axios";
import { exec } from "child_process"
import ytdl from "@distube/ytdl-core";
const SpotifyWebApi = require("spotify-web-api-node")

const request = require("request")
dotenv.config()

const chatIDs: number[] = []
const BOT_TOKEN = process.env.BOT_TOKEN
const shazam = new Shazam()
const youtube_api_key = process.env.youtube_api_key || "AIzaSyCG4zqP90ylR_u-1e-7Ze6JDfpsCSW3rak"
let title = ""

const download = (url: string, path: string, callback: any) => {
    request.head(url, () => {
        request(url).pipe(fs.createWriteStream(path)).on('close', callback);
    });
};

const addImageToAudio = (audioFile: string, imageFile: string) => {
    const ffmpegCommand = `ffmpeg -i "${audioFile}" -i "${imageFile}" -map 0 -map 1 -c:a copy -c:v mjpeg -id3v2_version 3 -metadata title="Song Title" -metadata artist="Artist" "${audioFile}"`;

    exec(ffmpegCommand, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error adding image: ${stderr}`);
            return;
        }
        console.log(`Image added to ${audioFile}`);
    });
};

const downloadAudioFromYouTube = (youtubeURL: string, outputFile: string) => {
    // yt-dlp command to download audio and convert to MP3
    const command = `yt-dlp -x --audio-format mp3 -o "${outputFile}" "${youtubeURL}"`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error: ${stderr}`);
            return;
        }
        addImageToAudio(outputFile, "./mine.jpg")
    })
};



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
            ctx.reply("⏳")
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
                        downloadAudioFromYouTube(`https://www.youtube.com/watch?v=${res.data.items[0].id.videoId}`, `./songs/@in2_something - ${title}.mp3`)
                        // ctx.sendAudio(`./songs/in2_something - ${title}.mp3`)
                        // fs.unlink(`./songs/in2_something - ${title}.mp3`
                        //     , (err: any) => {
                        //         console.error(err)
                        //     })
                        // fs.unlink(`./videos/${video_id.file_id}.mp4`
                        //     , (err: any) => {
                        //         console.error(err)
                        //     })
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