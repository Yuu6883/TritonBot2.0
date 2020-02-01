const { RichEmbed } = require("discord.js");
const Corona = require("../src/modules/Corona");

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return /^corona$/.test(message.content);
    },
    run: async function(message) {
        try {
            let result = await Corona.fromQQ();
            let embed = new RichEmbed()
                .setTitle("China Corona Virus Report " + result.chinaTotal.date)
                .setURL("https://news.qq.com/zt2020/page/feiyan.htm")
                .setThumbnail("https://riotimes-11af1.kxcdn.com/wp-content/uploads/2020/01/virus.jpg")
                .addField("Infected",  `**${result.chinaTotal.confirm}**`)
                .addField("Suspect",   `**${result.chinaTotal.suspect}**`)
                .addField("Recovered", `**${result.chinaTotal.heal}**`)
                .addField("Dead",      `**${result.chinaTotal.dead}**`)
                .setFooter(`Last Update: ${result.lastUpdateTime} (GMT+8)`);
            message.channel.send(embed);
        } catch (e) {
            this.logger.onError(e);
            message.channel.send("Failed to fetch from source");
        }
    }
}