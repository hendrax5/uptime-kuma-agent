const { R } = require("redbean-node");
const { log } = require("../src/util");
const dayjs = require("dayjs");

class AgentManager {
    static ioNamespace = null;
    static agents = new Map(); // agent_id -> socket

    static init(io) {
        this.ioNamespace = io.of("/agent");

        this.ioNamespace.use(async (socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }
            try {
                let agent = await R.findOne("agent", " token = ? ", [token]);
                if (agent) {
                    socket.agentId = agent.id;
                    socket.agentName = agent.name;
                    return next();
                } else {
                    return next(new Error("Invalid token"));
                }
            } catch (err) {
                return next(new Error("Authentication error"));
            }
        });

        this.ioNamespace.on("connection", async (socket) => {
            log.info("agent", `Agent connected: ${socket.agentName} (${socket.agentId})`);
            this.agents.set(socket.agentId, socket);

            // Update status in DB
            await R.exec("UPDATE agent SET status = 1, last_seen = ? WHERE id = ?", [R.isoDateTimeMillis(dayjs()), socket.agentId]);

            socket.on("disconnect", async () => {
                log.info("agent", `Agent disconnected: ${socket.agentName}`);
                if (this.agents.get(socket.agentId) === socket) {
                    this.agents.delete(socket.agentId);
                }
                await R.exec("UPDATE agent SET status = 0 WHERE id = ?", [socket.agentId]);
            });
        });
    }

    static async executeOnAgent(agentId, monitorJSON) {
        return new Promise((resolve, reject) => {
            const socket = this.agents.get(agentId);
            if (!socket) {
                return reject(new Error(`Agent ${agentId} is not connected. Check Agents menu or change 'Run From' back to Master.`));
            }

            const timeoutSeconds = (monitorJSON.timeout || 20);
            const timeout = setTimeout(() => {
                reject(new Error(`Agent execution timeout (${timeoutSeconds}s)`));
            }, timeoutSeconds * 1000 + 5000);

            socket.emit("execute_monitor", monitorJSON, (result) => {
                clearTimeout(timeout);
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result); // { status: 1|0, ping: 120, msg: "OK" }
                }
            });
            
            // update last seen
            R.exec("UPDATE agent SET last_seen = ? WHERE id = ?", [R.isoDateTimeMillis(dayjs()), agentId]);
        });
    }
}

module.exports = { AgentManager };
