const GOL = require("../src/modules/GameOfLife");
const { loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
GOL.DEBUG = true;

// let gol = GOL.fromText(fs.readFileSync("test.txt", "utf-8"));
// gol.renderVideo().then(console.log); 

loadImage(path.resolve(__dirname, "gary.jpg")).then(img => {
    GOL.fromImage(img, true).renderVideo().then(console.log);
});