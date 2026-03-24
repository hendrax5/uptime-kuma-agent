<template>
    <div>
        <div class="add-btn mt-3 mb-3">
            <button class="btn btn-primary me-2" type="button" @click="showAddAgentDialog = true">
                <font-awesome-icon icon="plus" />
                {{ $t("Add Agent") }}
            </button>
        </div>

        <div>
            <span
                v-if="agentList.length === 0"
                class="d-flex align-items-center justify-content-center my-3"
            >
                {{ $t("No Agents") }}
            </span>

            <div v-for="agent in agentList" :key="agent.id" class="item shadow-box mb-3">
                <div class="left-part">
                    <div class="circle" :class="agent.status === 1 ? 'bg-primary' : 'bg-danger'"></div>
                    <div class="info">
                        <div class="title">{{ agent.name }}</div>
                        <div class="status">
                            {{ agent.status === 1 ? 'Online' : 'Offline' }}
                        </div>
                        <div class="date mb-1">
                            Token: <code>{{ agent.token }}</code>
                        </div>
                        <div class="date">
                            Last Seen: {{ agent.last_seen ? $t("updatedAt", { date: agent.last_seen }) : 'Never' }}
                        </div>
                    </div>
                </div>

                <div class="buttons">
                    <button class="btn btn-danger" @click="deleteDialog(agent.id)">
                        <font-awesome-icon icon="trash" />
                        {{ $t("Delete") }}
                    </button>
                </div>
            </div>
        </div>

        <Confirm ref="confirmDelete" btn-style="btn-danger" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="deleteAgent">
            Are you sure you want to delete this agent? Monitors relying on it will revert to Master.
        </Confirm>

        <!-- Add Agent Dialog -->
        <div class="modal fade" tabindex="-1" :class="{ show: showAddAgentDialog }" :style="{ display: showAddAgentDialog ? 'block' : 'none' }">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Agent</h5>
                        <button type="button" class="btn-close" @click="showAddAgentDialog = false"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Agent Name</label>
                            <input v-model="newAgentName" type="text" class="form-control" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showAddAgentDialog = false">Close</button>
                        <button type="button" class="btn btn-primary" @click="addAgent">Add</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showAddAgentDialog" class="modal-backdrop fade show"></div>
    </div>
</template>

<script>
import Confirm from "../Confirm.vue";

export default {
    components: {
        Confirm,
    },
    data() {
        return {
            agentList: [],
            selectedAgentID: null,
            showAddAgentDialog: false,
            newAgentName: "",
        };
    },
    mounted() {
        this.loadAgents();
    },
    methods: {
        loadAgents() {
            this.$root.getSocket().emit("getAgentList", (res) => {
                if (res.ok) {
                    this.agentList = res.agents;
                }
            });
        },
        addAgent() {
            if (!this.newAgentName) return;
            this.$root.getSocket().emit("addAgent", { name: this.newAgentName }, (res) => {
                if (res.ok) {
                    this.showAddAgentDialog = false;
                    this.newAgentName = "";
                    this.loadAgents();
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },
        deleteDialog(id) {
            this.selectedAgentID = id;
            this.$refs.confirmDelete.show();
        },
        deleteAgent() {
            this.$root.getSocket().emit("deleteAgent", this.selectedAgentID, (res) => {
                if (res.ok) {
                    this.loadAgents();
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../../assets/vars.scss";

.item {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    justify-content: space-between;
    padding: 15px;

    .left-part {
        display: flex;
        gap: 15px;
        align-items: flex-start;

        .circle {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-top: 5px;
        }

        .info {
            .title {
                font-weight: bold;
                font-size: 18px;
            }
            .status {
                font-size: 14px;
                opacity: 0.8;
            }
            .date {
                font-size: 14px;
                opacity: 0.6;
            }
        }
    }
}
</style>
