<template>
    <div class="hop-analysis-timeline my-3 p-3 bg-dark text-white rounded shadow">
        <h4 class="mb-4 d-flex align-items-center">
            <font-awesome-icon icon="network-wired" class="me-2 text-info" />
            Live Traceroute Analysis
            <span v-if="packetLoss !== null" class="badge ms-auto" :class="packetLossClass">
                Packet Loss: {{ packetLoss.toFixed(2) }}%
            </span>
        </h4>
        
        <div v-if="!hops || hops.length === 0" class="text-center text-muted py-4">
            No hop data available. Enable "Hop Analysis" and wait for the next ping.
        </div>
        
        <div v-else class="timeline-container">
            <div 
                v-for="(hop, index) in hops" 
                :key="index" 
                class="hop-node d-flex align-items-center mb-3"
            >
                <div class="hop-indicator position-relative">
                    <div class="pulse-ring" :class="getHopStatusClass(hop)"></div>
                    <div class="hop-dot" :class="getHopStatusClass(hop)"></div>
                    <div v-if="index !== hops.length - 1" class="hop-line"></div>
                </div>
                
                <div class="hop-details ms-4 flex-grow-1 p-2 rounded" :class="getHopBackgroundClass(hop)">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="hop-ip fw-bold font-monospace">
                            {{ hop.ip && hop.ip !== '*' ? hop.ip : 'Request Timed Out' }}
                        </span>
                        <span v-if="hop.rtt1 && hop.rtt1 !== '*'" class="hop-ms badge bg-secondary">
                            {{ hop.rtt1 }} ms
                        </span>
                        <span v-else class="hop-ms badge bg-danger">
                            Timeout
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "HopAnalysisTimeline",
    props: {
        hopsData: {
            type: String,
            default: "[]"
        },
        packetLoss: {
            type: Number,
            default: null
        }
    },
    computed: {
        hops() {
            try {
                if (!this.hopsData) return [];
                const parsed = JSON.parse(this.hopsData);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        },
        packetLossClass() {
            if (this.packetLoss === null) return 'bg-secondary';
            if (this.packetLoss === 0) return 'bg-success';
            if (this.packetLoss < 20) return 'bg-warning text-dark';
            return 'bg-danger';
        }
    },
    methods: {
        getHopStatusClass(hop) {
            if (!hop.ip || hop.ip === '*') return 'status-timeout';
            if (parseFloat(hop.rtt1) > 100) return 'status-warning';
            return 'status-success';
        },
        getHopBackgroundClass(hop) {
            if (!hop.ip || hop.ip === '*') return 'bg-danger bg-opacity-10 border border-danger';
            if (parseFloat(hop.rtt1) > 100) return 'bg-warning bg-opacity-10 border border-warning';
            return 'bg-success bg-opacity-10 border border-success';
        }
    }
}
</script>

<style scoped>
.hop-analysis-timeline {
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.timeline-container {
    padding-left: 10px;
    padding-top: 10px;
}

.hop-indicator {
    width: 20px;
    display: flex;
    justify-content: center;
    z-index: 2;
}

.hop-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    z-index: 2;
    position: relative;
    box-shadow: 0 0 10px currentcolor;
}

.hop-line {
    position: absolute;
    top: 12px;
    left: 50%;
    width: 2px;
    height: calc(100% + 1.5rem);
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-50%);
    z-index: 1;
}

.status-success {
    background-color: #28a745;
    color: #28a745;
}

.status-warning {
    background-color: #ffc107;
    color: #ffc107;
}

.status-timeout {
    background-color: #dc3545;
    color: #dc3545;
}

.pulse-ring {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    top: -6px;
    left: -6px;
    opacity: 0.4;
    animation: pulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}

@keyframes pulse {
    0% { transform: scale(0.5); opacity: 0.8; }
    70% { transform: scale(1.5); opacity: 0; }
    100% { transform: scale(0.5); opacity: 0; }
}
</style>
