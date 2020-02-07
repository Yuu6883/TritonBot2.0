const fetch = require("node-fetch");
const { loadImage } = require("canvas");
const fs = require("fs");
const { Attachment } = require("discord.js");
const GOL = require("../src/modules/GameOfLife");
let BUSY_RENDERING = false;

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return /^gol\b/i.test(message.content);
    },
    run: async function(message) {
        
        let help = /(-h)|(--help)/.test(message.cleanContent);

        if (help) {
            return message.channel.send("Attach a `.(txt|jpg|bmp|png)` file with initial board to render output\n" +
                "[Options]\n" + 
                "\t**-h, --help**:   print out this long and useless message\n" +
                "\t**-i, --invert**: invert the image parsing process (default is RGB average > 128 equals alive cell)\n" +
                "\t**-s, --steps**:  number of simulations. From 1 to 2500 (default 100)\n" +
                "\t**-l, --length**: output video length in seconds, from 5 to 60 (default 20)\n" +
                "\t**-bg, --background**: dead cell color in hexadecimal (default **#000000**)\n" + 
                "\t**-fg, --foreground**: living cell color in hexadecimal (default **#FFFFFF**)\n");
        }

        let invert = /(-i)|(--invert)/.test(message.cleanContent);
        let gp = /((-s)|(--steps))\s+(?<steps>\d+)/i.exec(message.cleanContent);
        let steps = gp ? ~~gp.groups.steps : 100;
        gp = /((-l)|(--length))\s+(?<length>\d+)/i.exec(message.cleanContent)
        let videoLength = gp ? ~~gp.groups.length : 20;
        gp = /((-fg)|(--foreground))\s+(?<fg>#[0-9a-f]{6})/i.exec(message.cleanContent);
        let fg = gp ? gp.groups.fg : "";
        gp = /((-bg)|(--background))\s+(?<bg>#[0-9a-f]{6})/i.exec(message.cleanContent);
        let bg = gp ? gp.groups.bg : "";

        if (steps <= 0 || steps > 2500) {
            return message.reply("Simulation steps must be in [1, 2500]");
        }
        if (videoLength <= 5 || videoLength > 60) {
            return message.reply("Video length must be in [5, 60] seconds");
        }

        let matchingFile = message.attachments.find(file => /\.(txt|jpeg|jpg|bmp|png)$/.test(file.filename));

        if (!matchingFile) {
            return message.channel.send("Attach a `.(txt|jpg|bmp|png)` file with initial board to render output");
        }

        if (matchingFile.filename.endsWith(".txt") && matchingFile.filesize > 5 * 1024) { // 5kb
            return message.reply(`This text file is bigger than 5kb, aborting`);
        } else if (matchingFile.filesize > 5 * 1024 * 1024) { // 5mb
            return message.reply(`This file is bigger than 5mb, aborting`);
        }

        if (BUSY_RENDERING) {
            setTimeout(() => {
                module.exports.run(message);
            }, 5000);
        }

        try {

            BUSY_RENDERING = true;
            message.channel.startTyping();

            let start = Date.now();
            /** @type {GOL} */
            let gol;
            if (matchingFile.filename.endsWith(".txt")) {
                let res = await fetch(textFile.url);
                let text = await res.text();
                gol = GOL.fromText(text);
            } else {
                let img = await loadImage(matchingFile.url);
                gol = GOL.fromImage(img, invert);
            }

            gol.steps = steps;
            gol.background = bg;
            gol.foreground = fg;
            gol.videoLength = videoLength;

            let videoPath = await gol.renderVideo();
            await message.channel.send(`Time elapsed: **${((Date.now() - start) / 1000).toFixed(2)}** seconds`, 
                new Attachment(videoPath, `${Date.now()}.mp4`));

            fs.unlinkSync(videoPath);
        } catch (e) {
            this.logger.onError(e);
            message.channel.send(`Error: ${e ? e.message || e : "unkown error"}`);
        } finally {
            BUSY_RENDERING = false;
            message.channel.stopTyping(true);
        }
    }
}