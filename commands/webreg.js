const { Attachment } = require("discord.js");

/** @type {Object<string,UCSDCourse[]>} */
const courses = {
    "wi20": require('../data/WI20.json'),
}

const { Canvas } = require("canvas");

const days = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

const parseDay = code => {
    if (!code) return "";
    days.forEach((v, i) => code = code.replace(i + 1, v));
    return code;
}

const toAMorPM = (n, m) => n >= 12 ? ((n - 12) || "12") + ":" + 
        String(m).padStart(2, "0") + "p" : n + ":" + String(m).padStart(2, "0") + "a";

const parseTime = (startH, startM, endH, endM) => {
    startH = ~~startH;
    startM = ~~startM;
    endH = ~~endH;
    endM = ~~endM;
    return toAMorPM(startH, startM) + "-" + toAMorPM(endH, endM);
}

/** @type {BaseCommand} */
module.exports = {
    verify: async function(message) {
        return /^webreg/i.test(message.cleanContent);
    },
    run: async function(message) {
        let args = message.content.replace("webreg", "").trim().split(" ");

        if (!args[0]) {
            message.channel.send("Type **Webreg [wi20] {Course code}** to check out a course");
            return;
        }

        args[0] = args[0].toLowerCase();
        args[1] = args.slice(1).join("");

        if (!courses[args[0]]) {
            args[1] = args[0];
            args[0] = Object.keys(courses)[0];
        }

        let code = args[1];
        if (!code) {
            message.channel.send("Type **Webreg [wi20] {Course code}** to check out a course");
            return;
        }
        
        let course = courses[args[0]].find(c => (c.SUBJ_CODE.trim() + 
            c.CRSE_CODE.trim()).includes(code.toUpperCase()));

        if (course) {

            let sections = course.SECTIONS.filter(v => v.FK_SPM_SPCL_MTG_CD.trim() != "MI");

            let h = 60 + 30 + 50 * sections.length;
            let canvas = new Canvas(800, h);
            let ctx = canvas.getContext("2d");

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 800, h);

            ctx.fillStyle = "#498fff";
            ctx.fillRect(0, 0, 800, 60);
            ctx.fillStyle = "#002b54";
            ctx.fillRect(0, 60, 800, 30);
            ctx.fillStyle = "white";

            ctx.textAlign = "center";
            ctx.font = "30px DejaVu Sans";
            ctx.fillText(`${course.SUBJ_CODE.trim()} ${course.CRSE_CODE.trim()} ${course.CRSE_TITLE}`, 400, 40, 800);
            
            ctx.font = "18px DejaVu Sans";
            ctx.textAlign = "left";
            ctx.fillText("Section", 4, 82);
            ctx.fillText("Type", 90, 82);
            ctx.fillText("Days", 150, 82);
            ctx.fillText("Time", 230, 82);
            ctx.fillText("Building", 350, 82);
            ctx.fillText("Total Seat", 430, 82);
            ctx.fillText("Instructor", 540, 82);

            sections.sort((a, b) => {
                let letterA = a.SECT_CODE.charCodeAt(0), numA = parseInt(a.SECT_CODE.slice(1));
                let letterB = b.SECT_CODE.charCodeAt(0), numB = parseInt(b.SECT_CODE.slice(1));
                if (letterA > letterB) return 1;
                if (letterA < letterB) return -1;
                if (numA > numB) return 1;
                if (numA < numB) return -1;
                return 0;
            });

            sections.forEach((sec, i) => {
                
                ctx.fillText(sec.SECT_CODE, 4, 83 + 50 * (i + 1));
                ctx.fillText(sec.FK_SPM_SPCL_MTG_CD.trim() || sec.FK_CDI_INSTR_TYPE || "", 90, 83 + 50 * (i + 1));
                ctx.fillText(parseDay(sec.DAY_CODE) || "", 150, 83 + 50 * (i + 1));
                ctx.fillText(parseTime(sec.BEGIN_HH_TIME, sec.BEGIN_MM_TIME, sec.END_HH_TIME, sec.END_MM_TIME), 206, 83 + 50 * (i + 1));
                ctx.fillText(sec.BLDG_CODE || "", 350, 83 + 50 * (i + 1));
                ctx.textAlign = "center";
                ctx.fillText(sec.SCTN_CPCTY_QTY || "", 460, 83 + 50 * (i + 1));
                ctx.textAlign = "left";
                ctx.fillText(sec.PERSON_FULL_NAME ?  sec.PERSON_FULL_NAME.trim()
                    .replace(/A\d+ /g, " ").split(";").join(" ") : "", 540, 83 + 50 * (i + 1));
            });

            let pic = new Attachment(canvas.toBuffer(), `${course.SUBJ_CODE.trim()}${course.CRSE_CODE.trim()}.png`);
            message.channel.send(pic);
        } else {
            message.channel.send(`Can not find course code: ${code}`);
        }
        
    }
}