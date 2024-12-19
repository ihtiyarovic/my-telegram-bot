import express from "express"
import axios from "axios"
import dotenv from "dotenv"
import fs, { write } from "fs"
import { Telegraf } from "telegraf"

const chatIds: number[] = []

dotenv.config()

const BOT_TOKEN: any = process.env.BOT_TOKEN
const AUDD_API_TOKEN: any = process.env.AUDD_API_TOKEN

if (!BOT_TOKEN) {
    console.log("you need check your BOT_TOKEN")
} else {
    const bot = new Telegraf(BOT_TOKEN)
    bot.start((ctx) => {
        ctx.sendMessage("Welcome to our BOT!")
        const userID = ctx.update.message.chat.id
        if (!chatIds.includes(userID)) {
            chatIds.push(userID)
        }
    })
    bot.on("video", async (ctx) => {
        const message_id = ctx.update.message.message_id
        ctx.reply("We're on the way.....")

        try {

            const fileId: string = ctx.message.video.file_id
            const fileLink = await ctx.telegram.getFileLink(fileId)

            // Download the video
            const videoPath = `./temp/${fileId}.mp4`
            const writer = fs.createWriteStream(videoPath)


            const response = await axios({
                url: fileLink.href,
                method: "GET",
                responseType: "stream"
            });

            response.data.pipe(writer)

            // Wait for the download to complete
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Send video to song recognition API (using Audd.io as an example)
            const apiResponse = await axios.post('https://api.audd.io/', {
                api_token: AUDD_API_TOKEN,
                file: fs.createReadStream(videoPath),
            }, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Send recognition result to user
            if (apiResponse.data && apiResponse.data.result) {
                const songDetails = apiResponse.data.result;
                ctx.deleteMessage(message_id + 1)
                await ctx.reply(`Song Recognized! 🎵\n\nTitle: ${songDetails.title}\nArtist: ${songDetails.artist}`);
                console.log(message_id)

            } else {
                ctx.deleteMessage(message_id + 1)
                await ctx.reply("Sorry, I couldn't recognize the song. 😔");
            }

        } catch (error) {
            console.error(error)
            ctx.reply("An error occurred while processing the video. Please try again.")

        }
    })

    bot.launch()
}




