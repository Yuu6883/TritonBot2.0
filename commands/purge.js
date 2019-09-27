/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return message.author.id == this.config.Bot.Owner && /^purge ./.test(message.content);
    },
    run: async function(message) {
        
        let channel = message.mentions.channels.first() || message.channel;

        let numberToPurge = ~~message.cleanContent.replace(/\D/g, '');

        if (numberToPurge <= 0 || numberToPurge > 100)
            return void await message.reply("Invalid number of message to purge");

        let result = await channel.bulkDelete(numberToPurge);
        let status = await message.reply(`${result.size} messages purged in ${channel}`);
        status.deletable && (await status.delete(5000));
    }
}