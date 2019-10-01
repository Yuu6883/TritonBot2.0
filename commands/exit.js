/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return message.author.id == this.config.Bot.Owner && /^\$exit$/.test(message.content);
    },
    run: async function(message) {
        process.exit(0);
    }
}