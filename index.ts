import dotenv from "dotenv"
import fs from "fs"
const acrcloud = require("acrcloud")
import { Telegraf } from "telegraf"
const ffmpeg = require('fluent-ffmpeg');
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



const options = {
    method: 'GET',
    url: 'https://api-name.p.rapidapi.com/endpoint',
    headers: {
        'X-RapidAPI-Key': 'b7b32ab4camshfdb42f836ff0e2dp1bbae3jsnd2c92dd8bb55',
        'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
    },
    params: {
        key1: 'value1',
        key2: 'value2'
    }
};

// const download = (url, path, callback) => {
//     request.head(url, (err, res, body) => {
//         request(url).pipe(fs.createWriteStream(path)).on('close', callback);
//     });
// };



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

        const video = await ctx.telegram.getFile(ctx.update.message.video.file_id)
        console.log(video)
        // console.log(ctx.update.message.video.file_id)

        // ffmpeg('input.mp4')
        //     .output('output.avi')
        //     .on('end', () => {
        //         console.log('Conversion complete');
        //     })
        //     .on('error', (err: any) => {
        //         console.error('Error: ', err.message);
        //     })
        //     .run();

    })

    bot.launch()
}