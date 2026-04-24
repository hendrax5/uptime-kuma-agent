    <div class="hop-analysis-timeline my-3 p-4 bg-dark text-white rounded-4 shadow-lg border border-secondary border-opacity-25">
        <h4 class="mb-4 d-flex align-items-center">
            <font-awesome-icon icon="network-wired" class="me-3 text-info fs-3" />
            <span class="fw-bold tracking-wide">Live Path Analysis</span>
            <span v-if="packetLoss !== null" class="badge rounded-pill ms-auto px-3 py-2 fs-6" :class="packetLossClass">
                Loss: {{ packetLoss.toFixed(2) }}%
            </span>
        </h4>
        
        <div v-if="!hops || hops.length === 0" class="text-center text-muted py-5">
            <font-awesome-icon icon="route" class="fs-1 mb-3 opacity-50" />
            <h5>No path data available</h5>
            <p>Enable "Hop Analysis" in monitor settings and wait for the next ping.</p>
        </div>
        
        <div v-else class="timeline-container position-relative mt-2">
            <div 
                v-for="(hop, index) in hops" 
                :key="index" 
                class="hop-node d-flex align-items-stretch mb-4"
            >
                <div class="hop-indicator position-relative d-flex flex-column align-items-center me-4">
                    <div class="pulse-ring" :class="getHopStatusClass(hop)"></div>
                    <div class="hop-dot" :class="getHopStatusClass(hop)">
                        <span class="hop-number">{{ hop.hop }}</span>
                    </div>
                    <div v-if="index !== hops.length - 1" class="hop-line flex-grow-1"></div>
                </div>
                
                <div class="hop-details flex-grow-1 p-3 rounded-3 shadow-sm border-start border-4" :class="getHopBackgroundClass(hop)">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="hop-ip fw-bold font-monospace fs-5" :class="{'text-light': hop.ip && hop.ip !== '*', 'text-danger opacity-75': !hop.ip || hop.ip === '*'}">
                                {{ hop.ip && hop.ip !== '*' ? hop.ip : 'Request Timed Out' }}
                            </span>
                            <div class="text-muted small mt-1 d-flex gap-3">
                                <span>Hop {{ hop.hop }}</span>
                                <span v-if="hop.rtt2 && hop.rtt2 !== '*'">Probes: 3</span>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-4 align-items-center" v-if="hop.rtt1 && hop.rtt1 !== '*'">
                            <div class="metric-box text-end">
                                <div class="text-muted text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Latency</div>
                                <div class="hop-ms fw-bold text-info fs-5">
                                    {{ hop.rtt1 }}
                                </div>
                            </div>
                            <div class="vr bg-secondary opacity-50" style="width: 2px;"></div>
                            <div class="metric-box text-start" style="min-width: 60px;">
                                <div class="text-muted text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Jitter</div>
                                <div class="hop-jitter fw-bold fs-5" :class="getJitterColor(hop)">
                                    {{ calculateJitter(hop) }} <span style="font-size: 0.8em">ms</span>
                                </div>
                            </div>
                        </div>
                        <span v-else class="badge bg-danger rounded-pill px-3 py-2">
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
        calculateJitter(hop) {
            const parseRtt = (val) => {
                if (!val || val === '*') return null;
                if (val.includes('<')) return 0.5;
                return parseFloat(val);
            };
            const rtt1 = parseRtt(hop.rtt1);
            const rtt2 = parseRtt(hop.rtt2);
            const rtt3 = parseRtt(hop.rtt3);
            
            const diffs = [];
            if (rtt1 !== null && rtt2 !== null) diffs.push(Math.abs(rtt1 - rtt2));
            if (rtt2 !== null && rtt3 !== null) diffs.push(Math.abs(rtt2 - rtt3));
            if (rtt1 !== null && rtt3 !== null) diffs.push(Math.abs(rtt1 - rtt3));
            
            if (diffs.length === 0) return "0.0";
            return Math.max(...diffs).toFixed(1);
        },
        getJitterColor(hop) {
            const jitter = parseFloat(this.calculateJitter(hop));
            if (jitter < 2) return 'text-success';
            if (jitter < 15) return 'text-warning';
            return 'text-danger';
        },
        getHopStatusClass(hop) {
            if (!hop.ip || hop.ip === '*') return 'status-timeout';
            if (parseFloat(hop.rtt1) > 100) return 'status-warning';
            return 'status-success';
        },
        getHopBackgroundClass(hop) {
            if (!hop.ip || hop.ip === '*') return 'border-danger bg-dark bg-gradient opacity-75';
            if (parseFloat(hop.rtt1) > 100) return 'border-warning bg-dark bg-gradient';
            return 'border-success bg-dark bg-gradient';
        }
    }
}
</script>

<style scoped>
.hop-analysis-timeline {
    background: linear-gradient(145deg, #1a1a1e 0%, #121214 100%);
}

.timeline-container {
    padding-left: 5px;
}

.hop-indicator {
    width: 32px;
}

.hop-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    z-index: 2;
    position: relative;
    box-shadow: 0 0 15px currentcolor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 0.8rem;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.hop-line {
    width: 3px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
    margin-top: -5px;
    margin-bottom: -15px;
    z-index: 1;
    border-radius: 2px;
}

.status-success {
    background-color: #10b981;
    color: #10b981;
}

.status-warning {
    background-color: #f59e0b;
    color: #f59e0b;
}

.status-timeout {
    background-color: #ef4444;
    color: #ef4444;
}

.pulse-ring {
    position: absolute;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    top: -10px;
    left: -8px;
    opacity: 0.2;
    animation: pulse 2.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
}

.hop-details {
    background-color: #1e1e24;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.hop-details:hover {
    transform: translateX(8px);
    background-color: #25252b;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.metric-box {
    line-height: 1.2;
}

.tracking-wide {
    letter-spacing: 0.5px;
}

@keyframes pulse {
    0% { transform: scale(0.5); opacity: 0.6; }
    70% { transform: scale(1.2); opacity: 0; }
    100% { transform: scale(0.5); opacity: 0; }
}
</style>
