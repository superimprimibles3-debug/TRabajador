// Popup Script - Maneja la interfaz del popup

class PopupManager {
    constructor() {
        this.multipliers = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateUI();

        // Actualizar cada 2 segundos
        setInterval(() => this.loadData(), 2000);
    }

    async loadData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['multipliers'], (result) => {
                this.multipliers = result.multipliers || [];
                this.updateUI();
                resolve();
            });
        });
    }

    setupEventListeners() {
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearData());
        document.getElementById('viewAllBtn').addEventListener('click', () => this.viewAll());

        // Escuchar nuevos multiplicadores
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'newMultiplier') {
                this.loadData();
            }
        });
    }

    updateUI() {
        this.updateStats();
        this.updateRecentList();
        this.updateDistribution();
    }

    updateStats() {
        const total = this.multipliers.length;
        document.getElementById('totalRounds').textContent = total;

        if (total === 0) {
            document.getElementById('average').textContent = '0.00x';
            document.getElementById('max').textContent = '0.00x';
            document.getElementById('min').textContent = '0.00x';
            return;
        }

        const values = this.multipliers.map(m => m.multiplier);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / total;
        const max = Math.max(...values);
        const min = Math.min(...values);

        document.getElementById('average').textContent = avg.toFixed(2) + 'x';
        document.getElementById('max').textContent = max.toFixed(2) + 'x';
        document.getElementById('min').textContent = min.toFixed(2) + 'x';
    }

    updateRecentList() {
        const recentList = document.getElementById('recentList');

        if (this.multipliers.length === 0) {
            recentList.innerHTML = '<p class="empty-state">Esperando datos...</p>';
            return;
        }

        const recent = this.multipliers.slice(-10).reverse();
        recentList.innerHTML = recent.map(record => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            const s = date.getSeconds().toString().padStart(2, '0');
            const time = `${h}:${m}:${s}`;

            return `
                <div class="recent-item">
                    <span class="recent-multiplier">${record.multiplier.toFixed(2)}x</span>
                    <span class="recent-time">${time}</span>
                </div>
            `;
        }).join('');
    }

    updateDistribution() {
        const distribution = document.getElementById('distribution');

        if (this.multipliers.length === 0) {
            distribution.innerHTML = '<p class="empty-state">Sin datos</p>';
            return;
        }

        const ranges = [
            { label: '1.00x - 1.49x', min: 1.00, max: 1.49 },
            { label: '1.50x - 1.99x', min: 1.50, max: 1.99 },
            { label: '2.00x - 2.99x', min: 2.00, max: 2.99 },
            { label: '3.00x - 4.99x', min: 3.00, max: 4.99 },
            { label: '5.00x+', min: 5.00, max: Infinity }
        ];

        const counts = ranges.map(range => {
            return this.multipliers.filter(m =>
                m.multiplier >= range.min && m.multiplier <= range.max
            ).length;
        });

        const maxCount = Math.max(...counts);

        distribution.innerHTML = ranges.map((range, i) => {
            const count = counts[i];
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return `
                <div class="distribution-item">
                    <span class="distribution-label">${range.label}</span>
                    <div class="distribution-bar">
                        <div class="distribution-fill" style="width: ${percentage}%">
                            ${count > 0 ? count : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    exportCSV() {
        if (this.multipliers.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const csv = [
            ['Multiplicador', 'Fecha', 'Hora', 'URL'],
            ...this.multipliers.map(record => {
                const date = new Date(record.timestamp);
                return [
                    record.multiplier.toFixed(2),
                    date.toISOString().split('T')[0],
                    date.toTimeString().split(' ')[0],
                    record.url
                ];
            })
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aviator-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
            chrome.storage.local.set({ multipliers: [] }, () => {
                this.multipliers = [];
                this.updateUI();
            });
        }
    }

    viewAll() {
        // Crear una nueva ventana con todos los datos
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Todos los Multiplicadores</title>
                <style>
                    body {
                        font-family: 'Segoe UI', sans-serif;
                        background: #1a1a2e;
                        color: #fff;
                        padding: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background: rgba(255,255,255,0.1);
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    th {
                        background: rgba(255,255,255,0.2);
                        font-weight: 600;
                    }
                    tr:hover {
                        background: rgba(255,255,255,0.05);
                    }
                </style>
            </head>
            <body>
                <h1>📊 Todos los Multiplicadores (${this.multipliers.length})</h1>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Multiplicador</th>
                            <th>Fecha y Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.multipliers.map((record, i) => {
            const date = new Date(record.timestamp);
            return `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><strong>${record.multiplier.toFixed(2)}x</strong></td>
                                    <td>${new Date(record.timestamp).toISOString().replace('T', ' ').split('.')[0]}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(html);
        newWindow.document.close();
    }
}

// Inicializar
new PopupManager();
