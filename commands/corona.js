const { RichEmbed } = require("discord.js");
const Corona = require("../src/modules/Corona");

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return /^corona\b/.test(message.content);
    },
    run: async function(message) {
        if (message.content.toLowerCase().includes("qq")) {
            try {
                let result = await Corona.fromQQ();
                let embed = new RichEmbed()
                    .setTitle("Corona Virus Report from QQ " + result.chinaTotal.date)
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
        } else {
            try {
                let result = await Corona.fromJH();let embed = new RichEmbed()
                    .setTitle("Corona Virus Report from Johns Hopkins CSSE")
                    .setURL("https://gisanddata.maps.arcgis.com/apps/opsdashboard/index.html#/85320e2ea5424dfaaa75ae62e5c06e61")
                    .setThumbnail("https://riotimes-11af1.kxcdn.com/wp-content/uploads/2020/01/virus.jpg")
                    .addField("Total Confirmed", `**${result.total}**`)
                    .addField("Total Recovered", `**${result.recover}**`)
                    .addField("Total Death",     `**${result.death}**`)
                message.channel.send(embed);
            } catch (e) {
                this.logger.onError(e);
                message.channel.send("Failed to fetch from source");
            }
        }        
    }
}