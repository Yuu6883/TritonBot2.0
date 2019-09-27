const cheerio = require("cheerio");
const fetch = require("node-fetch");
const fs = require("fs");

const SOURCE_URL = "http://www.gradesource.com/reports/7/30926/index.html";
const DATA_PATH = `${__dirname}/../../data/`;
const FILE = "cse12enroll.json";

/** @type {Object.<string,number>} */
let data = {};

if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);
if (!fs.existsSync(`${DATA_PATH}/${FILE}`)) 
    fs.writeFileSync(`${DATA_PATH}/${FILE}`, "{}");
else
    data = require(`${DATA_PATH}/${FILE}`);

const saveData = () => fs.writeFileSync(`${DATA_PATH}/${FILE}`, JSON.stringify(data, null, 4));

module.exports = async () => {

    let sourceRes = await fetch(SOURCE_URL);
    let html = await sourceRes.text();
    const $ = cheerio.load(html);
    let info = $($("table")[4]).text();
    let lines = info.split("\n");
    let enrolled = ~~lines[6].split(": ")[1];
    let lastUpdate = lines[8].split(": ")[1];
    let timestamp = Date.parse(lastUpdate);

    let recent = Object.keys(data).slice(-1)[0];
    let delta = 0;

    if (recent) {
        let before = data[recent];
        delta = before - enrolled;
    }

    data[Date.now()] = enrolled;
    saveData();

    return {
        timestamp,
        lastUpdate,
        enrolled,
        delta
    }
}