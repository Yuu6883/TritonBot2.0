const { inspect } = require("util");
const { RichEmbed } = require("discord.js");

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return message.author.id == this.config.Bot.Owner && /^eval ./.test(message.content);
    },
    run: async function(message) {

        let code = message.content.slice(5);
        const start = process.hrtime.bigint();
        let channel = message.channel;
        let guild = message.guild;

        try {
            let evaled = eval(code);
            if (evaled instanceof Promise) evaled = await evaled;
            const end = process.hrtime.bigint();
            const type = evaled && typeof evaled === 'object' && evaled.constructor ? evaled.constructor.name : typeof evaled;
            const output = inspect(evaled, {
                depth: 0,
                maxArrayLength: 100
            }).replace(new RegExp(this.config.Bot.Token, "g"), "secret bruh");
    
            message.reply(new RichEmbed()
                .setDescription(`**📥 Input**\n\`\`\`js\n${code}\n\`\`\`\n**📤 Output**\n\`\`\`js\n${output}\n\`\`\`\n**❔ Type:** \`${type}\``)
                .setFooter(`executed in ${Number(end - start) / 1000000} milliseconds`, message.author.displayAvatarURL)
            );
        } catch (error) {
			const end = process.hrtime.bigint();
			error = inspect(error, {
				depth: 0,
				maxArrayLength: 0
            });
            
            message.reply(new RichEmbed()
                .setDescription( `**📥 Input**\n\`\`\`js\n${code}\n\`\`\`\n**❗ Error:**\n\`\`\`\n${error}\n\`\`\``)
                .setFooter(`executed in ${Number(end - start) / 1000000} milliseconds`, message.author.displayAvatarURL)
            );
		}
    }
};