const { RichEmbed } = require("discord.js");

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return message.author.id == this.config.Bot.Owner && /^embed ./.test(message.content);
    },
    run: async function(message) {

        let channel = message.mentions.channels.first() || message.channel;

        let everyone = message.content.includes("--everyone");

        let content = message.content.replace(`<#${channel.id}>`, "")
                                     .replace("--everyone", "")
                                     .slice(6).trim();
        let [title, description, thumbnail, ...fields] = content.split("|");

        let embed = new RichEmbed()
            .setTitle(title || "Title")
            .setDescription(description || "")
            .setThumbnail(thumbnail || this.user.avatarURL)
            .setColor("#ffcc00")
            .setFooter("", "https://jacobsschool.ucsd.edu/faculty/faculty_bios/photos/300.jpg")
            .setTimestamp();

        fields.forEach(f => {
            let [field, ...extra] = f.split(":");
            embed.addField(field, extra.join(":"));
        });

        if (everyone) {
            await channel.send("@everyone", embed);
        } else await channel.send(embed);
    }
}