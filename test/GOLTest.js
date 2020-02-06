const GOL = require("../src/modules/GameOfLife");
const fs = require("fs");
GOL.DEBUG = true;
let gol = GOL.fromText(fs.readFileSync("test.txt", "utf-8"));
gol.renderVideo().then(console.log);