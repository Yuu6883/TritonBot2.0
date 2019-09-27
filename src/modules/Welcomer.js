const { RichEmbed } = require("discord.js");

module.exports = class Welcomer {
    
    /** @param {import("../Bot")} bot */
    constructor(bot) {
        this.bot = bot;
    }

    /** @param {import("discord.js").GuildMember} member */
    async welcome(member) {
        let channel = member.guild.channels.find(c => c.name.includes("welcome"));

        if (channel) {
            let embed = new RichEmbed()
                .setThumbnail(member.user.displayAvatarURL)
                .setTitle(`Welcome, ${member.user.username}#${member.user.discriminator}`)
                .setTimestamp();

            channel.send(embed);
        }

        let adminRole = member.guild.roles.get("627016688214212618");
        let memberRole = member.guild.roles.get("627019550931550218");

        if (member.user.id == this.bot.config.Bot.Owner && adminRole) {
            await member.addRole(adminRole);
        } else if (memberRole) {
            await member.addRole(memberRole);
        }
    }
}