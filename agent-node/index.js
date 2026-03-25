const { io } = require("socket.io-client");
const axios = require("axios");
const ping = require("ping");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv))
  .option("master", {
    alias: "m",
    type: "string",
    description: "URL of the Uptime Kuma Master node",
    default: process.env.MASTER_URL
  })
  .option("token", {
    alias: "t",
    type: "string",
    description: "Agent connection token",
    default: process.env.AGENT_TOKEN
  })
  .argv;

if (!argv.master || !argv.token) {
    console.error("Missing required arguments. Please provide --master and --token or set MASTER_URL and AGENT_TOKEN environment variables.");
    process.exit(1);
}

console.log(`Connecting to Master at ${argv.master}...`);

const socket = io(`${argv.master}/agent`, {
    auth: {
        token: argv.token
    }
});

socket.on("connect", () => {
    console.log(`Connected to Master! Assigned socket ID: ${socket.id}`);
});

socket.on("connect_error", (err) => {
    console.error(`Connection Error: ${err.message}`);
});

socket.on("disconnect", () => {
    console.log("Disconnected from Master.");
});

socket.on("execute_monitor", async (monitor, callback) => {
    console.log(`Received execution request for Monitor [${monitor.name}] Type: ${monitor.type}`);
    const startTime = Date.now();
    let result = {
        status: 0,
        ping: 0,
        msg: ""
    };

    try {
        if (monitor.type === "http" || monitor.type === "keyword" || monitor.type === "json-query") {
            // Simplified HTTP check for the MVP agent
            const res = await axios({
                url: monitor.url,
                method: monitor.method || "get",
                timeout: (monitor.timeout || 20) * 1000,
                validateStatus: null // accept all statuses so we don't throw on 404
            });
            
            result.ping = Date.now() - startTime;
            result.msg = `${res.status} - ${res.statusText}`;

            // Check if status is accepted
            const accepted = JSON.parse(monitor.accepted_statuscodes_json || monitor.accepted_statuscodes || '["200-299"]');
            
            let isAccepted = false;
            for (let code of accepted) {
                if (code.includes("-")) {
                    const [min, max] = code.split("-").map(c => parseInt(c));
                    if (res.status >= min && res.status <= max) {
                        isAccepted = true;
                        break;
                    }
                } else if (parseInt(code) === res.status) {
                    isAccepted = true;
                    break;
                }
            }

            if (isAccepted) {
                result.status = 1; // UP
            } else {
                result.status = 0; // DOWN
            }

            // Keyword check
            if (result.status === 1 && monitor.type === "keyword") {
                let keywordFound = typeof res.data === 'string' ? res.data.includes(monitor.keyword) : JSON.stringify(res.data).includes(monitor.keyword);
                if (keywordFound === !monitor.invertKeyword) {
                    result.msg += ", keyword " + (keywordFound ? "is" : "not") + " found";
                } else {
                    result.status = 0;
                    result.msg = "Keyword not found";
                }
            }

        } else if (monitor.type === "ping") {
             const pingCount = monitor.ping_count || 1;
             const pingOpts = {
                 timeout: monitor.ping_per_request_timeout || monitor.timeout || 20,
                 min_reply: pingCount,
                 numeric: monitor.ping_numeric !== undefined ? monitor.ping_numeric : true,
                 extra: [],
             };

             // Add packet size if specified
             if (monitor.packetSize) {
                 pingOpts.packetSize = monitor.packetSize;
             }

             // Add deadline (global timeout)
             if (monitor.timeout) {
                 pingOpts.deadline = monitor.timeout;
             }

             const res = await ping.promise.probe(monitor.hostname, pingOpts);
             if (res.alive) {
                 result.status = 1;
                 // Use parseFloat to preserve decimal precision (e.g. 1.23ms instead of 1ms)
                 result.ping = parseFloat(res.time) || (Date.now() - startTime);
                 result.msg = "";
             } else {
                 result.status = 0;
                 result.msg = res.output || "Ping timeout/failed";
             }
        } else {
            result.status = 0;
            result.msg = `Agent does not support monitor type: ${monitor.type} currently.`;
        }
    } catch (err) {
        result.status = 0;
        result.msg = err.message;
    }

    console.log(`Execution finished. Sending result: ${result.status === 1 ? 'UP' : 'DOWN'}`);
    callback(result);
});
