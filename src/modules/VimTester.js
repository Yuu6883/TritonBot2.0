
/** @typedef {{ channel: import("discord.js").TextChannel, 
 test: Test, points: number, total: number, fail: number, level: number, 
 questionTimestamp: number, totalTime: number
 lastMessage: import("discord.js").Message }} VimUser */

const { RichEmbed } = require("discord.js");

module.exports = class VimTester {

    /** @param {import("../Bot")} bot */
    constructor(bot) {
        this.bot = bot;

        /** @type {Object<string, VimUser} */
        this.users = {};
        this.tries = 15;
        this.failLimit = 3;
    }

    /**
     * @param {import("discord.js").Message} message
     * @param {number} level
     */
    async start(message, level) {
        let userID = message.author.id;

        if (this.users[userID])
            return void message.channel.send(`You are already doing Vim practice in ` + 
                                             `<#${this.users[userID].channel.id}>`);

        let channel = await message.author.createDM().catch(_ => {});

        if (!channel)
            return void message.reply("Failed to create DM with you. " +
                "Please enable **Allow direct messages from server members** in **Privacy Settings** of this server.");

        message.deletable && message.delete(3000);
        await (await message.reply("Vim practice starting in your DMs.")).delete(3000);

        let embed = new RichEmbed()
            .setTitle(`Vim Practice Starting (level ${level})`)
            .setDescription("Type **exit** or **quit** or **stop** to end this practice.\n" +
                            "Type **esc** for [escape key]\n" +
                            `Number of questions: **${this.tries}**\n` +
                            "**GLHF**")
            .setThumbnail("https://jacobsschool.ucsd.edu/faculty/faculty_bios/photos/300.jpg")
            .setColor("#ffcc00")
            .setTimestamp();

        await channel.send(embed);

        this.bot.logger.info(`${message.author.username}#${message.author.discriminator} is practicing Vim(level${level})`);

        let user = this.users[userID] = { channel, level, points: 0, total: 0, fail: 0, totalTime: 0 };
        await this.makeNewTest(user);
    }

    get logger() { return this.bot.logger }

    /** @param {import("discord.js").Message} message */
    async check(message) {
        let user = this.users[message.author.id];
        if (!user) return;
        if (user.channel.id !== message.channel.id) return;

        message.deletable && message.delete(3000);

        if (/^exit|stop|quit$/.test(message.cleanContent)) 
            return this.stop(message.author.id, true);

        if (user.test.keys.includes(message.cleanContent)) {

            user.fail = 0;
            user.points++;
            user.lastMessage.deletable && user.lastMessage.delete(1000);
            user.totalTime += Date.now() - user.questionTimestamp;

            await user.channel.send(`Correct (progress **${(user.total / this.tries * 100).toFixed(1)}%**)`).then(m => m.delete(1000));

        } else {
            
            user.fail++;

            if (user.fail >= this.failLimit) {
                user.lastMessage.deletable && (await user.lastMessage.delete());
                user.fail = 0;
                await user.channel.send(`Incorrect! Correct answer is **${user.test.keys.join("** or **")}**\n` +
                                        `(progress **${(user.total / this.tries * 100).toFixed(1)}%**)`).then(m => m.delete(5000));
            } else {

                user.totalTime += Date.now() - user.questionTimestamp;
                await user.channel.send(`Incorrect! You have **${this.failLimit - user.fail}** more tries on this question.`);
                return true;
            }
            
        }

        if (user.total >= this.tries) {

            let embed = new RichEmbed()
                .setTitle("Vim Practice Report")
                .setDescription(`You got **${(user.points / this.tries * 100).toFixed(1)}%** questions correct!\n` +
                                "**" + correctRateMessage(user.points / this.tries) + "**")
                .setFooter(`Time elapsed: ${(user.totalTime / 1000 / 60).toFixed(1)} minute(s)`)
                .setThumbnail("https://jacobsschool.ucsd.edu/faculty/faculty_bios/photos/300.jpg")
                .setColor("#ffcc00")
                .setTimestamp();

            this.logger.info(`${message.author.username}#${message.author.discriminator} ` + 
                             `completed Vim practive(level${user.level}) with ` + 
                             `${(user.points / this.tries * 100).toFixed(1)}% correct rate`);

            await user.channel.send(embed);

            this.stop(message.author.id);
        } else {
            await this.makeNewTest(user);
        }

        return true;
    }

    /** @param {VimUser} user */
    async makeNewTest(user) {
        user.test = randomTest(user.level);
        user.total++;
        user.lastMessage = await user.channel.send(`Vim question#${user.total}: **${user.test.prompt}**`);
        user.questionTimestamp = Date.now();
    }

    /**
     * @param {string} userID
     */
    stop(userID, interupt) {
        let user = this.users[userID];

        if (!user) return false;
        if (interupt) {
            user.lastMessage.deletable && user.lastMessage.delete(1000);
            user.channel.send(`Vim practice has stopped.`);
        }
        
        return delete this.users[userID];
    }
}

const correctRateMessage = rate => {
    if (rate == 1)  return "Nailed it :scream:";
    if (rate > 0.9) return "Almost perfect :laughing:";
    if (rate > 0.7) return "Need more practice on this level :smirk:";
    if (rate == 0)  return ":thinking: ".repeat(10);
    return "You can do better :cry:";
}

/** @param {number} level */
const randomTest = level => {

    let randomLevel = Math.floor(Math.random() * level) + 1;

    /** @type {Object<string, string[]} */
    let levelTests = VimCommands[`level${randomLevel}`] || VimCommands.level1;

    let keys = Object.keys(levelTests);
    let key = keys[Math.floor(Math.random() * keys.length)];

    return { prompt: key, keys: levelTests[key]};
}

/** @typedef {{ prompt: string, keys: string[] }} Test */

const VimCommands = {
    level1: {
        "Move cursor left": [
            "h"
        ],
        "Move cursor right": [
            "l"
        ],
        "Move cursor down": [
            "j"
        ],
        "Move cursor up": [
            "k"
        ],
        "Close file": [
            ":q"
        ],
        "Close file, don't save changes": [
            ":q!"
        ],
        "Save changes to file": [
            ":w"
        ],
        "Save changes and close file": [
            ":wq",
            ":x",
            "ZZ"
        ],
        "Delete character at cursor": [
            "x"
        ],
        "Insert at cursor": [
            "i"
        ],
        "Insert at beginning of line": [
            "I"
        ],
        "Append at cursor": [
            "a"
        ],
        "Append at end of line": [
            "A"
        ],
        "Exit insert mode": [
            "esc",
            "escape",
            "ctrl+["
        ]
    },
    level2: {
        "Delete word": [
            "dw"
        ],
        "Delete to end of line": [
            "d$",
            "D"
        ],
        "Next word": [
            "w"
        ],
        "Go to end of text on current line": [
            "$"
        ],
        "Go to beginning of text on current line": [
            "^"
        ],
        "Go to beginning of current line": [
            "0"
        ],
        "Go two words forward": [
            "2w"
        ],
        "Go to end of third word ahead": [
            "3e"
        ],
        "Delete two words": [
            "d2w"
        ],
        "Delete entire line": [
            "dd"
        ],
        "Delete two lines": [
            "2dd"
        ],
        "Undo last change": [
            "u"
        ],
        "Undo changes on entire line": [
            "U"
        ],
        "Redo changes": [
            "ctrl+r"
        ]
    },
    level3: {
        "Paste after cursor": [
            "p"
        ],
        "Paste before cursor": [
            "P"
        ],
        "Replace character under cursor": [
            "r"
        ],
        "Change word": [
            "cw"
        ],
        "Change to end of line": [
            "c$",
            "C"
        ],
        "Change two words": [
            "c2w"
        ]
    },
    level4: {
        "Go to line 50": [
            "50G",
            ":50"
        ],
        "Go to last line in file": [
            "G"
        ],
        "Go to first line in file": [
            "gg"
        ],
        "Search for \"waldo\"": [
            "/waldo"
        ],
        "Go to next search result": [
            "n"
        ],
        "Go to previous search result": [
            "N"
        ],
        "Search backwards for \"carmen\"": [
            "?carmen"
        ],
        "Jump to previous location (jump back)": [
            "ctrl+o"
        ],
        "Jump to next location (jump forward)": [
            "ctrl+i"
        ],
        "Go to matching parentheses or brackets": [
            "%"
        ],
        "Replace bad with good in current line": [
            ":%s/bad/good"
        ],
        "Replace hi with bye in entire file": [
            ":%s/hi/bye/g"
        ],
        "Replace x with y in entire file, prompt for changes": [
            ":%s/x/y/gc"
        ]
    },
    level5: {

    },
    level6: {

    },
    level7: {
        
    }
}