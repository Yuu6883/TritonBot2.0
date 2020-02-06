const ffmpegPath = process.platform == "win32" ? require("@ffmpeg-installer/ffmpeg").path : "ffmpeg";
const { spawn } = require("child_process");
const Path = require("path");
const fetch = require("node-fetch");
const UID = require("uid-safe");
const { Canvas, loadImage } = require("canvas");

const OUTPUT_PATH = Path.resolve(__dirname, "..", "..", "data");

module.exports = class GOL {

    static BACKGROUND = "#000000";
    static FOREGROUND = "#ffffff";
    static MAX_FRAME = 30 * 10;
    static FPS = 10;
    static WAIT = 1;
    static DEBUG = false;

    /**
     * @param {number} rows 
     * @param {number} cols 
     * @param {number} steps
     */
    constructor(rows, cols, steps = 200) {
        if (rows < 4 || cols < 4) throw new Error(`Invalid Arguments: [${rows}, ${cols}, ${steps}]`);
        if (rows > 1000 || cols > 1000) throw new Error("Dimension Too Big (>1000)");
        if (rows > 100 || cols > 100) {
            this.unit = ~~(1000 / Math.max(rows, cols));
        } else this.unit = 10;
        if (GOL.DEBUG) console.log(`Unit length: ${this.unit}`);
        this.canvas = new Canvas(cols * this.unit, rows * this.unit);
        this.ctx = this.canvas.getContext("2d");
        this.rows = rows;
        this.cols = cols;
        this.steps = steps;
        this.bufferA = new Uint8Array(this.rows * this.cols);
        this.bufferB = new Uint8Array(this.rows * this.cols);
        this.currentBuffer = this.bufferA;
        this.nextBuffer = this.bufferB;
        /** @type {number[][]} */
        this.changedIndices = [];
    }

    /**
     * @param {number} row 
     * @param {number} col 
     */
    getIndex(row, col) {
        return row * this.cols + col;
    }

    /**
     * @param {number} row 
     * @param {number} col 
     */
    isAlive(row, col) {
        row = ~~row;
        col = ~~col;
        if (row <= 0 || row >= this.rows - 1 || col <= 0 || col >= this.cols - 1) return false;
        return this.currentBuffer[this.getIndex(row, col)] === 1;
    }

    /**
     * @param {number} row 
     * @param {number} col 
     */
    setAlive(row, col, alive = true, both = false) {
        row = ~~row;
        col = ~~col;
        if (row <= 0 || row >= this.rows - 1 || col <= 0 || col >= this.cols - 1) return;
        this.nextBuffer[this.getIndex(row, col)] = alive ? 1 : 0;
        if (both) this.currentBuffer[this.getIndex(row, col)] = alive ? 1 : 0;
    }

    swapBuffer() {
        [this.currentBuffer, this.nextBuffer] = [this.nextBuffer, this.currentBuffer];
    }

    render(force = false) {
        // Force fill all grids
        if (force) {
            this.ctx.fillStyle = GOL.BACKGROUND;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = GOL.FOREGROUND;

            for (let row = 1; row < this.rows - 1; row++) {
                for (let col = 1; col < this.cols - 1; col++) {
                    if (this.isAlive(row, col)) {
                        this.ctx.fillRect(col * this.unit, row * this.unit, this.unit, this.unit);
                    }
                }
            }

        // Only render changed cells
        } else {
            for (let [row, col] of this.changedIndices) {
                this.ctx.fillStyle = this.isAlive(row, col) ? GOL.FOREGROUND : GOL.BACKGROUND;
                this.ctx.fillRect(col * this.unit, row * this.unit, this.unit, this.unit);
            }
            this.changedIndices = [];
        }
    }

    simulate() {
        for (let row = 1; row < this.rows - 1; row++) {
            for (let col = 1; col < this.cols - 1; col++) {

                let count = 0;
                this.isAlive(row + 1, col) && count++;
                this.isAlive(row - 1, col) && count++;
                this.isAlive(row, col + 1) && count++;
                this.isAlive(row, col - 1) && count++;
                this.isAlive(row - 1, col + 1) && count++;
                this.isAlive(row - 1, col - 1) && count++;
                this.isAlive(row + 1, col + 1) && count++;
                this.isAlive(row + 1, col - 1) && count++;

                if (this.isAlive(row, col)) {
                    if (count < 2 || count > 3) {
                        this.setAlive(row, col, false);
                        this.changedIndices.push([row, col]);
                    } else this.setAlive(row, col, true);                    
                } else {
                    if (count === 3) {
                        this.setAlive(row, col, true); 
                        this.changedIndices.push([row, col]);
                    } else this.setAlive(row, col, false);
                }
            }
        }
        this.swapBuffer();
    }

    getCurrentFrame() {
        return this.canvas.toBuffer("image/jpeg", { quality: 1 });
    }

    /** @return {Promise<string>} */
    renderVideo() {
        return new Promise((resolve, reject) => {
            let uid = UID.sync(20);
            let args = [
                '-y',
                '-f', 'image2pipe',
                '-framerate', GOL.FPS.toString(), // frames per second
                '-i', '-',
                '-profile:v', 'baseline',
                '-crf', '10',
                '-pix_fmt', 'yuv420p', // Pixel Format
                '-c:v', 'libx264',
                Path.resolve(OUTPUT_PATH, uid + ".mp4")];
            /** @type {NodeJS.Process} */
            let ffmpeg = spawn(ffmpegPath, args);

            if (GOL.DEBUG) ffmpeg.stderr.pipe(process.stdout);

            for (let i = 0; i < GOL.WAIT * GOL.FPS; i++) {
                ffmpeg.stdin.write(this.getCurrentFrame());
            }

            for (let i = 0; i < this.steps; i++) {
                ffmpeg.stdin.write(this.getCurrentFrame());
                this.simulate();
                this.render();
            }

            ffmpeg.stdin.end();
            ffmpeg.on("exit", code => code ? reject(`FFMPEG EXIT WITH CODE ${code}`) : 
                resolve(Path.resolve(OUTPUT_PATH, uid + ".mp4")));
        });
    }

    /** @param {string} text */
    static fromText(text) {
        let [rows, cols, ...coords] = text.split(/\n|\r/g).filter(s => s);
        let gol = new GOL(~~rows, ~~cols);
        for (let token of coords) {
            let [row, col] = token.split(" ").map(Number);
            gol.setAlive(row, col, true, true);
        }
        gol.render(true);
        return gol;
    }
}