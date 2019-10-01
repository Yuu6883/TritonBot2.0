const CourerSrcapper = require("./CourseScrapper");
const { RichEmbed } = require("discord.js");

module.exports = class EnrollmentTracker {
    
    /** @param {import("../Bot")} bot */
    constructor(bot) {
        this.bot = bot;
        this.interval = 5 * 60 * 1000; // 5 minutes
        /** @type {import("discord.js").TextChannel} */
        this.channel = bot.channels.find(c => c.id == bot.config.Bot.TrackerChannelID);
        this.recentData = {};

        if (this.channel) this.startScrapping();
    }

    async countPrevious() {
        let messages = await this.channel.fetchMessages();
        return messages.size;
    }

    startScrapping() {
        this.scrap();
    }

    async scrap() {
        let result = await CourerSrcapper();
        this.recentData = result;

        let embed = new RichEmbed()
            .setTitle(`Enrollment Status`)
            .setURL("http://www.gradesource.com/reports/7/30926/index.html")
            .setThumbnail("https://jacobsschool.ucsd.edu/faculty/faculty_bios/photos/300.jpg")
            .setFooter(`Gradesource last updated at ${new Date(result.timestamp).toString().split(" ").slice(0, 4).join(" ")}`)
            .setTimestamp();

        if (!(await this.countPrevious())) {

            embed.setDescription(`**${result.enrolled}** enrolled students`);
            await this.channel.send(embed);

        } else if (result.delta) {

            embed.setDescription(`**${Math.abs(result.delta)}** students just ${result.delta > 0 ? "dropped" : "enrolled"} the class\n` + 
                                 `**${result.enrolled}** enrolled students`);
            await this.channel.send(embed);
        }

        this.timeout = setTimeout(this.scrap.bind(this), this.interval);
    }

    stopScrapping() {
        this.timeout && clearTimeout(this.timeout);
    }

}