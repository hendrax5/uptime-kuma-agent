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
             // Use system ping directly and parse RTT from output for accuracy
             // The 'ping' npm package on Alpine can return incorrect times
             const { exec } = require("child_process");
             const count = monitor.ping_count || 1;
             const timeout = monitor.timeout || 10;
             const hostname = monitor.hostname;

             // Build ping command with options
             let cmd = `ping -c ${count} -W ${timeout} -n`;
             if (monitor.packetSize) {
                 cmd += ` -s ${monitor.packetSize}`;
             }
             cmd += ` ${hostname}`;

             const pingResult = await new Promise((resolve) => {
                 exec(cmd, { timeout: (timeout + 5) * 1000 }, (error, stdout, stderr) => {
                     const output = stdout || stderr || "";

                     // Parse individual ping RTT: "time=1.23 ms" or "time=0.456 ms"
                     const timeMatches = output.match(/time[=<]([\d.]+)\s*ms/g);
                     if (timeMatches && timeMatches.length > 0) {
                         // Extract all RTT values and calculate average
                         const times = timeMatches.map(m => {
                             const val = m.match(/([\d.]+)/);
                             return val ? parseFloat(val[1]) : null;
                         }).filter(t => t !== null);

                         if (times.length > 0) {
                             const avg = times.reduce((a, b) => a + b, 0) / times.length;
                             resolve({ alive: true, time: Math.round(avg * 100) / 100, output });
                             return;
                         }
                     }

                     // Fallback: parse from rtt summary line "min/avg/max/mdev = 0.1/0.2/0.3/0.0 ms"
                     const rttMatch = output.match(/=\s*([\d.]+)\/([\d.]+)\/([\d.]+)/);
                     if (rttMatch) {
                         resolve({ alive: true, time: parseFloat(rttMatch[2]), output }); // [2] = avg
                         return;
                     }

                     // Ping failed
                     resolve({ alive: false, time: 0, output });
                 });
             });

             if (pingResult.alive) {
                 result.status = 1;
                 result.ping = pingResult.time;
                 result.msg = "";
                 console.log(`  Ping RTT: ${pingResult.time}ms`);
             } else {
                 result.status = 0;
                 result.msg = pingResult.output || "Ping timeout/failed";
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
