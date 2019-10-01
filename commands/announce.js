const fetch = require("node-fetch");
const { Attachment } = require("discord.js");

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return message.author.id == this.config.Bot.Owner && /^announce ./.test(message.content);
    },
    run: async function(message) {
        if (message.guild) {
            /** @type {import("discord.js").TextChannel} */
            let channel = message.mentions.channels.first() ||
                message.guild.channels.find(n => /announce/.test(n.name));
            
            if (!channel || channel.type !== "text")
                return void await message.reply("Can't find announcement channel in this guild");

            let content = message.content.replace("announce ", "")
                                         .replace(`<#${channel.id}>`, "");
                                         
            if (content.trim()) await channel.send(content);

            for (let file of message.attachments.array()) {
                let response = await fetch(file.proxyURL);
                let buffer   = await response.buffer();
                
                await channel.send(new Attachment(buffer, file.filename));
            }

        } else {
            await message.reply(`This message is not received in a guild`);
        }
    }
}