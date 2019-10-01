/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return /^vim/i.test(message.cleanContent);
    },
    run: async function(message) {
        if (!/^vim (level|lvl)=?[1-6]$/i.test(message.cleanContent)) {
            return void await message.reply(`To start a Vim practice, type **vim** **level**=**{1 to 6}**`);
        }

        let level = ~~message.cleanContent.replace(/\D/g, "");

        if (level <= 0) {
            return void await message.reply(`Invalid level: ${level}`);
        }

        if (level > 2) {
            return void await message.reply(`Level higher than 2 is not supported yet because my owner hasn't completed it. :joy:`);
        }

        await this.vim.start(message, level);
    }
}