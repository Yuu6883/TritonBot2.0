const fetch = require("node-fetch");
const fs = require("fs");
const { Attachment } = require("discord.js");
const GOL = require("../src/modules/GameOfLife");

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return /^gol\b/i.test(message.content);
    },
    run: async function(message) {
        let textFile = message.attachments.find(file => file.filename.endsWith(".txt"));
        if (!textFile) {
            return message.channel.send("Attach a `.txt` file with initial board to render output");
        }
        if (textFile.filesize > 5 * 1024) { // 5kb
            return message.reply(`This text file is bigger than 5kb, aborting`);
        }
    
        try {
            let res = await fetch(textFile.url);
            let text = await res.text();
            let gol = GOL.fromText(text);
            let videoPath = await gol.renderVideo();
            await message.channel.send(new Attachment(videoPath, `${Date.now()}.mp4`));
            fs.unlinkSync(videoPath);
        } catch (e) {
            this.logger.onError(e);
            message.channel.send(`Error: ${e ? e.message || e : "unkown error"}`);
        }
    }
}