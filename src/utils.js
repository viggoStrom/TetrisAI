import crypto from "crypto"
import fs from "fs";
import express from "express"
import cors from "cors"


export const random = (max = 1, returnSeed = false, parseSeed = 0) => {
    const seed = parseSeed === 0 ? crypto.randomBytes(32) : parseSeed
    const prng = crypto.createHash('sha256');
    prng.update(seed);
    const hash = prng.digest('hex');
    const randomNumber = parseInt(hash, 16) / Math.pow(16, hash.length) * max
    return returnSeed ? [randomNumber, seed] : randomNumber
}


export class Logger {
    constructor() {
        this.dir = `./logs/${Date.now()}`
        fs.promises.mkdir(this.dir)

        this.gameReplayDir = `${this.dir}/replay.txt`
        fs.promises.writeFile(this.gameReplayDir, "")

        this.rawReplayDir = `${this.dir}/rawReplay.csv`
        fs.promises.writeFile(this.rawReplayDir, "")
    }

    saveNetwork(network) {
        fs.promises.writeFile(`${this.dir}/model.json`, JSON.stringify(network))

        const comms = new browserCommunications(this.rawReplayDir)
    }

    state(game) {
        const [map, piece] = game.display(false)
        let formattedString = ""
        map.forEach(row => {
            formattedString += row + "\n"
        })
        formattedString += "\n"
        const grid = [
            ["▯", "▯", "▯", "▯"],
            ["▯", "▯", "▯", "▯"],
            ["▯", "▯", "▯", "▯"],
            ["▯", "▯", "▯", "▯"],
        ]
        grid[piece.currentGrid()[0][1]][piece.currentGrid()[0][0]] = "▮"
        grid[piece.currentGrid()[1][1]][piece.currentGrid()[1][0]] = "▮"
        grid[piece.currentGrid()[2][1]][piece.currentGrid()[2][0]] = "▮"
        grid[piece.currentGrid()[3][1]][piece.currentGrid()[3][0]] = "▮"
        grid[0][3] += "\n"
        grid[1][3] += "\n"
        grid[2][3] += "\n"
        grid[3][3] += "\n"
        formattedString += "Active piece:\n"
        formattedString += grid.reverse().toString().replaceAll(",", "")
        formattedString += "\n"
        formattedString += "\n"

        fs.promises.appendFile(this.gameReplayDir, formattedString)

        this.saveRaw(game)
    }

    saveRaw(game) {
        const map = game.map
        let formattedString = ""
        map.forEach(row => {
            formattedString += row.toString().replaceAll("[").replaceAll("]") + ",\n"
        })

        fs.promises.appendFile(this.rawReplayDir, formattedString)
    }
}


export class browserCommunications {
    constructor(dir) {
        this.app = express()
        this.port = 3000

        this.app.use(cors({ origin: "http://127.0.0.1:5500" }))
        this.app.listen(this.port, () => {
            console.log("Listening on port", this.port);
        })
        this.app.get('/ask', async (req, res) => {
            fs.promises.readFile(dir, "utf-8").then(file => {
                console.log("Sent replay to client");
                res.json(file)
            })
        })
    }

    replay() {
    }

    // send() {
    //     this.app.get('/send/:input', async (req, res) => {
    //         const input = req.params.input.split(",")

    //         this.game.step(input)
    //         const [projectedMap, _] = this.game.getState()
    //         this.game.projectedMap = projectedMap

    //         res.json(this.game)
    //     })

    // }
}

