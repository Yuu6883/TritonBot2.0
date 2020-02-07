const ffmpegPath = process.platform == "win32" ? require("@ffmpeg-installer/ffmpeg").path : "ffmpeg";
const { spawn } = require("child_process");
const Path = require("path");
const UID = require("uid-safe");
const { Canvas } = require("canvas");

const OUTPUT_PATH = Path.resolve(__dirname, "..", "..", "data");

module.exports = class GOL {

    static BACKGROUND = "#000000";
    static FOREGROUND = "#ffffff";
    static STEPS = 200;
    static VID_LEN = 20;
    static WAIT = 1;
    static DEBUG = false;
    static THRESH = 128;

    /**
     * @param {number} rows 
     * @param {number} cols 
     */
    constructor(rows, cols) {
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
        this.steps = GOL.STEPS;
        this.bg = GOL.BACKGROUND;
        this.fg = GOL.FOREGROUND;
        this.fps = Math.round(this.steps / GOL.VID_LEN);
        this.bufferA = new Uint8Array(this.rows * this.cols);
        this.bufferB = new Uint8Array(this.rows * this.cols);
        this.currentBuffer = this.bufferA;
        this.nextBuffer = this.bufferB;
        /** @type {number[][]} */
        this.changedIndices = [];
    }

    /** @param {number} value */
    set videoLength(value) {
        this.fps = Math.round(this.steps / ~~value) || 10;
    }

    /** @param {string} value */
    set foreground(value) {
        if (/^#[0-9a-f]{6}$/.test(value))
            this.fg = value;
    }

    /** @param {string} value */
    set background(value) {
        if (/^#[0-9a-f]{6}$/.test(value))
            this.bg = value;
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
            this.ctx.fillStyle = this.bg;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = this.fg;

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
                this.ctx.fillStyle = this.isAlive(row, col) ? this.fg : this.bg;
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
                '-framerate', this.fps.toString(), // frames per second
                '-i', '-',
                '-profile:v', 'baseline',
                '-crf', '10',
                '-pix_fmt', 'yuv420p', // Pixel Format
                '-c:v', 'libx264',
                Path.resolve(OUTPUT_PATH, uid + ".mp4")];
            /** @type {NodeJS.Process} */
            let ffmpeg = spawn(ffmpegPath, args);

            if (GOL.DEBUG) ffmpeg.stderr.pipe(process.stdout);

            this.render(true); // Render first frame
            for (let i = 0; i < GOL.WAIT * this.fps.FPS; i++) {
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
        return gol;
    }

    /** @param {import("canvas").Image} image */
    static fromImage(image, invert = false) {
        if (image.height < 4 || image.width < 4) throw new Error("Image Too Small");

        let scaleDown = 1;
        if (image.height > 1000 || image.width > 1000) {
            scaleDown = Math.ceil(Math.max(image.height, image.width) / 1000);
        }
        let width = ~~(image.width / scaleDown);
        let height = ~~(image.height / scaleDown);

        let tempCanvas = new Canvas(width, height);
        let ctx = tempCanvas.getContext("2d");
        ctx.drawImage(image, 0, 0, width, height);
        let rgbaArray = ctx.getImageData(0, 0, width, height).data;

        let gol = new GOL(height, width);
        for (let row = 1; row < height - 1; row++) {
            for (let col = 1; col < width - 1; col++) {
                let [r, g, b] = rgbaArray.slice((row * width + col) * 4, (row * width + col + 1) * 4);

                if (invert ? (r + g + b) / 3 < GOL.THRESH : (r + g + b) / 3 > GOL.THRESH) 
                    gol.setAlive(row, col, true, true);
            }
        }
        return gol;
    }
}