/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return message.author.id == this.config.Bot.Owner && /^announce ./.test(message.content);
    },
    run: async function(message) {
        if (message.guild) {
            /** @type {import("discord.js").TextChannel} */
            let channel = message.guild.channels.find(n => n.name.includes("announce"));
            
            if (!channel || channel.type !== "text")
                return void await message.reply("Can't find announcement channel in this guild");

            channel.send(message.content.replace("announce ", ""));
        } else {
            await message.reply(`This message is not received in a guild`);
        }
    }
}