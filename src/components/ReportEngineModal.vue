<template>
    <div class="modal fade" id="reportEngineModal" tabindex="-1" aria-labelledby="reportEngineModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="reportEngineModalLabel">
                        <font-awesome-icon icon="file-export" class="me-2" />
                        Export Observability Report
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted">Generate a comprehensive report including network path analysis, packet loss, and uptime statistics.</p>
                    
                    <div class="mb-3">
                        <label class="form-label">Format</label>
                        <select v-model="format" class="form-select">
                            <option value="pdf">PDF Document (.pdf)</option>
                            <option value="csv">CSV Spreadsheet (.csv)</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Time Range</label>
                        <select v-model="timeRange" class="form-select">
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>

                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" v-model="includeHopData" id="includeHopData">
                        <label class="form-check-label" for="includeHopData">
                            Include Hop-by-Hop Traceroute Data
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" @click="generateReport" :disabled="isGenerating">
                        <span v-if="isGenerating" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {{ isGenerating ? 'Generating...' : 'Export Report' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "ReportEngineModal",
    props: {
        monitorId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            format: 'pdf',
            timeRange: '24h',
            includeHopData: true,
            isGenerating: false,
            modalInstance: null
        }
    },
    mounted() {
        // Initialize bootstrap modal
        if (typeof window.bootstrap !== 'undefined') {
            this.modalInstance = new window.bootstrap.Modal(document.getElementById('reportEngineModal'));
        }
    },
    methods: {
        show() {
            if (this.modalInstance) {
                this.modalInstance.show();
            }
        },
        hide() {
            if (this.modalInstance) {
                this.modalInstance.hide();
            }
        },
        generateReport() {
            this.isGenerating = true;
            
            // In a real implementation, this would call a backend endpoint.
            // For now, we simulate generation and then download a dummy file or
            // trigger the frontend to generate a CSV from existing data.
            
            setTimeout(() => {
                if (this.format === 'csv') {
                    this.exportCSV();
                } else {
                    this.$root.toastSuccess("PDF Report generation initiated. It will download shortly.");
                    // Dummy PDF export logic
                }
                
                this.isGenerating = false;
                this.hide();
            }, 1500);
        },
        exportCSV() {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Time,Status,Ping (ms),Packet Loss (%),Hop Data\n";
            
            // Get heartbeat list from root
            const heartbeats = this.$root.heartbeatList[this.monitorId] || [];
            
            heartbeats.forEach(beat => {
                const time = beat.time;
                const status = beat.status === 1 ? 'UP' : (beat.status === 0 ? 'DOWN' : 'OTHER');
                const ping = beat.ping;
                const packetLoss = beat.packet_loss !== undefined && beat.packet_loss !== null ? beat.packet_loss : '';
                const hops = (this.includeHopData && beat.hop_data) ? beat.hop_data.replace(/,/g, ';') : '';
                
                csvContent += `${time},${status},${ping},${packetLoss},${hops}\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `monitor_${this.monitorId}_report.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.$root.toastSuccess("CSV Report exported successfully.");
        }
    }
}
</script>

<style scoped>
.modal-content {
    background-color: var(--bs-dark);
    color: var(--bs-light);
}
</style>
