const { Client } = require("discord.js");

const CommandRegistry = require("./CommandRegistry");
const Tracker = require("./modules/EnrollmentTracker");
const Logger = require("./Logger");
const Config = require("../config");
const Welcomer = require("./modules/Welcomer");

module.exports = class Bot extends Client {

    /** @param {import("discord.js").ClientOptions} options */
    constructor(options) {
        super(options);
        this.on("ready", this.ready.bind(this));

        /** @type {BaseCommand[]} */
        this.commands = [];
        this.logger = new Logger();
        this.registry = new CommandRegistry(this);
        this.welcomer = new Welcomer(this);

        if (this.config.Bot.Token)
            this.login(this.config.Bot.Token);
    }

    get config() { return Config }

    async ready() {
        this.logger.info(`Bot logged in as ${this.user.username}#${this.user.discriminator}`);
        this.tracker = new Tracker(this);

        this.on("message", async message => {

            for (let command of this.commands) {

                if (command.verify) {
                    let verified = await command.verify.bind(this)(message);

                    if (verified && command.run) {
                        try {
                            await command.run.bind(this)(message);
                        } catch (_) {
                            this.logger.onError(_);
                        }
                    }
                }
            }
        });
        this.on("guildMemberAdd", this.welcomer.welcome.bind(this.welcomer));

        this.user.setActivity("with Gary");
    }

}