const { R } = require("redbean-node");
const { checkLogin } = require("../util-server");
const crypto = require("crypto");

module.exports.agentSocketHandler = (socket, server) => {
    socket.on("getAgentList", async (callback) => {
        try {
            checkLogin(socket);
            let agents = await R.getAll("SELECT * FROM agent ORDER BY name ASC");
            callback({
                ok: true,
                agents: agents,
            });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("addAgent", async (agentData, callback) => {
        try {
            checkLogin(socket);
            let agent = R.dispense("agent");
            agent.name = agentData.name;
            agent.token = crypto.randomUUID(); 
            agent.status = 0;
            await R.store(agent);
            callback({ ok: true, agent: agent });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("deleteAgent", async (agentId, callback) => {
        try {
            checkLogin(socket);
            await R.exec("DELETE FROM agent WHERE id = ?", [agentId]);
            // Optional: reset monitors using this agent to run from Master
            await R.exec("UPDATE monitor SET agent_id = NULL WHERE agent_id = ?", [agentId]);
            callback({ ok: true });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });
};
