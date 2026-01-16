"""
Panel de control principal - Diseño idéntico a la extensión.
Recrea exactamente la interfaz de sidepanel.html
"""
from PyQt5.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
                             QPushButton, QLabel, QCheckBox, QSpinBox, 
                             QScrollArea, QFrame, QGridLayout, QDoubleSpinBox)
from PyQt5.QtCore import Qt, QTimer, pyqtSignal, QTime
from PyQt5.QtGui import QFont, QIcon, QPalette, QColor
from typing import Optional

class CollapsibleSection(QFrame):
    """Sección colapsable como en la extensión"""
    
    def __init__(self, title: str, icon: str = ""):
        super().__init__()
        self.is_collapsed = False
        self.title = title
        self.icon = icon
        
        # Estilo de la sección
        self.setStyleSheet("""
            CollapsibleSection {
                background: #1e293b;
                border-radius: 8px;
                border: 1px solid #334155;
            }
        """)
        
        # Layout principal
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        self.setLayout(layout)
        
        # Header
        self.header = QPushButton(f"{icon} {title}")
        self.header.setStyleSheet("""
            QPushButton {
                background: rgba(255, 255, 255, 0.03);
                border: none;
                border-radius: 8px 8px 0 0;
                padding: 10px 12px;
                text-align: left;
                color: #f1f5f9;
                font-size: 13px;
                font-weight: 600;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.06);
            }
        """)
        self.header.clicked.connect(self.toggle)
        layout.addWidget(self.header)
        
        # Content container
        self.content_widget = QWidget()
        self.content_layout = QVBoxLayout()
        self.content_layout.setContentsMargins(12, 12, 12, 12)
        self.content_widget.setLayout(self.content_layout)
        layout.addWidget(self.content_widget)
    
    def toggle(self):
        """Alternar colapso"""
        self.is_collapsed = not self.is_collapsed
        self.content_widget.setVisible(not self.is_collapsed)
    
    def add_widget(self, widget):
        """Agregar widget al contenido"""
        self.content_layout.addWidget(widget)

class ControlPanel(QMainWindow):
    """Panel de control principal - Diseño de extensión"""
    
    # Señales
    start_capture = pyqtSignal()
    stop_capture = pyqtSignal()
    calibrate_ocr = pyqtSignal()
    calibrate_btn1 = pyqtSignal()
    calibrate_btn2 = pyqtSignal()
    test_click = pyqtSignal(str)  # tipo de test
    new_session = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.session_start_time = QTime.currentTime()
        self.initUI()
        
        # Timer para cronómetro
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_session_time)
        self.timer.start(1000)
    
    def initUI(self):
        """Inicializar interfaz idéntica a la extensión"""
        self.setWindowTitle("Aviator Tracker")
        self.setMinimumWidth(380)
        self.setMaximumWidth(420)
        
        # Estilos globales
        self.setStyleSheet("""
            QMainWindow {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #0f172a, stop:1 #1e293b);
            }
            QLabel {
                color: #f1f5f9;
            }
            QPushButton {
                background: #3b82f6;
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-weight: 500;
                font-size: 11px;
            }
            QPushButton:hover {
                background: #2563eb;
            }
            QPushButton.secondary {
                background: #334155;
            }
            QPushButton.secondary:hover {
                background: #475569;
            }
            QCheckBox {
                color: #94a3b8;
                spacing: 8px;
            }
            QCheckBox::indicator {
                width: 32px;
                height: 18px;
                border-radius: 9px;
                background: #334155;
            }
            QCheckBox::indicator:checked {
                background: #10b981;
            }
            QSpinBox, QDoubleSpinBox {
                background: #0f172a;
                border: 1px solid #334155;
                color: white;
                padding: 4px;
                border-radius: 4px;
            }
        """)
        
        # Widget central con scroll
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("""
            QScrollArea {
                border: none;
                background: transparent;
            }
            QScrollBar:vertical {
                width: 6px;
                background: transparent;
            }
            QScrollBar::handle:vertical {
                background: #475569;
                border-radius: 3px;
            }
            QScrollBar::handle:vertical:hover {
                background: #64748b;
            }
        """)
        
        scroll_content = QWidget()
        scroll.setWidget(scroll_content)
        
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        scroll_content.setLayout(main_layout)
        
        central_layout = QVBoxLayout()
        central_layout.setContentsMargins(0, 0, 0, 0)
        central_widget.setLayout(central_layout)
        central_layout.addWidget(scroll)
        
        # === HEADER ===
        self.create_header(main_layout)
        
        # === DASHBOARD CENTRALIZADO ===
        self.create_dashboard(main_layout)
        
        # === SECCIÓN RASTREO ===
        self.create_tracking_section(main_layout)
        
        # === SECCIÓN HISTORIAL ===
        self.create_history_section(main_layout)
        
        # === SECCIÓN CALIBRACIÓN ===
        self.create_calibration_section(main_layout)
        
        # === SECCIÓN SNIPER ===
        self.create_sniper_section(main_layout)
        
        # === SECCIÓN EXPONENCIAL ===
        self.create_exponential_section(main_layout)
        
        # === SECCIÓN DIAGNÓSTICO ===
        self.create_diagnostic_section(main_layout)
        
        # === SECCIÓN BYPASS ===
        self.create_bypass_section(main_layout)
        
        # === SECCIÓN BASE DE DATOS ===
        self.create_database_section(main_layout)
        
        main_layout.addStretch()
    
    def create_header(self, parent_layout):
        """Header con logo y estado"""
        header = QFrame()
        header.setStyleSheet("""
            QFrame {
                border-bottom: 1px solid #334155;
                padding-bottom: 10px;
            }
        """)
        layout = QHBoxLayout()
        layout.setContentsMargins(0, 0, 0, 10)
        header.setLayout(layout)
        
        # Logo y título
        title_container = QHBoxLayout()
        title = QLabel("Aviator Tracker")
        title.setStyleSheet("""
            font-size: 16px;
            font-weight: 700;
            color: #3b82f6;
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        """)
        title_container.addWidget(title)
        
        layout.addLayout(title_container)
        layout.addStretch()
        
        # Indicador de estado
        self.status_indicator = QLabel("●")
        self.status_indicator.setStyleSheet("""
            color: #ef4444;
            font-size: 16px;
        """)
        self.status_indicator.setToolTip("Conexión Extension")
        layout.addWidget(self.status_indicator)
        
        parent_layout.addWidget(header)
    
    def create_dashboard(self, parent_layout):
        """Dashboard centralizado con estadísticas"""
        dashboard = QFrame()
        dashboard.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #1e293b, stop:1 #0f172a);
                border-radius: 8px;
                border: 1px solid #334155;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout()
        dashboard.setLayout(layout)
        
        # Sesión y Target
        top_row = QHBoxLayout()
        
        # Sesión
        session_box = QVBoxLayout()
        session_label = QLabel("SESIÓN ACTIVA")
        session_label.setStyleSheet("font-size: 10px; color: #94a3b8; font-weight: 600;")
        self.partida_number = QLabel("#1")
        self.partida_number.setStyleSheet("font-weight: 800; font-size: 16px; color: #facc15;")
        session_box.addWidget(session_label)
        session_box.addWidget(self.partida_number)
        
        # Target
        target_box = QVBoxLayout()
        target_box.setAlignment(Qt.AlignRight)
        target_label = QLabel("TARGET")
        target_label.setStyleSheet("font-size: 10px; color: #94a3b8; font-weight: 600;")
        target_label.setAlignment(Qt.AlignRight)
        
        target_input_row = QHBoxLayout()
        self.target_input = QDoubleSpinBox()
        self.target_input.setRange(1.01, 100.00)
        self.target_input.setValue(1.11)
        self.target_input.setSingleStep(0.01)
        self.target_input.setDecimals(2)
        self.target_input.setStyleSheet("width: 45px; height: 18px; font-size: 11px;")
        target_x = QLabel("x")
        target_x.setStyleSheet("font-weight: 700; color: #10b981;")
        target_input_row.addWidget(self.target_input)
        target_input_row.addWidget(target_x)
        
        target_box.addWidget(target_label)
        target_box.addLayout(target_input_row)
        
        top_row.addLayout(session_box)
        top_row.addStretch()
        top_row.addLayout(target_box)
        
        layout.addLayout(top_row)
        
        # Separador
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("background: rgba(255,255,255,0.1); margin: 8px 0;")
        layout.addWidget(sep)
        
        # Grid de estadísticas principales (2x2)
        stats_grid = QGridLayout()
        stats_grid.setSpacing(8)
        
        # Rondas Totales
        self.stat_total = self.create_stat_box("Rondas Totales", "0", "#fff")
        stats_grid.addWidget(self.stat_total, 0, 0)
        
        # Sin Apostar
        self.stat_no_bet = self.create_stat_box("Sin Apostar", "0", "#64748b")
        stats_grid.addWidget(self.stat_no_bet, 0, 1)
        
        # Wins
        self.stat_wins = self.create_stat_box("Wins", "0", "#10b981", border_color="#10b981")
        stats_grid.addWidget(self.stat_wins, 1, 0)
        
        # Losses
        self.stat_losses = self.create_stat_box("Losses", "0", "#ef4444", border_color="#ef4444")
        stats_grid.addWidget(self.stat_losses, 1, 1)
        
        layout.addLayout(stats_grid)
        
        # Clicks detallados (3 columnas)
        clicks_grid = QGridLayout()
        clicks_grid.setSpacing(5)
        
        self.stat_click_ap = self.create_mini_stat("CLICK AP.", "0")
        self.stat_click_exp = self.create_mini_stat("CLICK EXP.", "0")
        self.stat_click_falso = self.create_mini_stat("CLICK FALSO", "0")
        
        clicks_grid.addWidget(self.stat_click_ap, 0, 0)
        clicks_grid.addWidget(self.stat_click_exp, 0, 1)
        clicks_grid.addWidget(self.stat_click_falso, 0, 2)
        
        layout.addLayout(clicks_grid)
        
        # Cronómetro
        self.session_timer = QLabel("CRONÓMETRO: 00:00:00")
        self.session_timer.setStyleSheet("""
            font-size: 9px;
            color: #475569;
            text-align: center;
            margin-top: 8px;
            letter-spacing: 1px;
        """)
        self.session_timer.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.session_timer)
        
        parent_layout.addWidget(dashboard)
    
    def create_stat_box(self, label: str, value: str, color: str, border_color: str = None):
        """Crear caja de estadística"""
        box = QFrame()
        style = f"""
            QFrame {{
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 6px;
        """
        if border_color:
            style += f"border-left: 3px solid {border_color};"
        style += "}"
        box.setStyleSheet(style)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(2)
        box.setLayout(layout)
        
        label_widget = QLabel(label)
        label_widget.setStyleSheet(f"font-size: 9px; color: {color}; text-transform: uppercase;")
        
        value_widget = QLabel(value)
        value_widget.setStyleSheet(f"font-size: 16px; font-weight: 800; color: {color};")
        value_widget.setObjectName("stat_value")
        
        layout.addWidget(label_widget)
        layout.addWidget(value_widget)
        
        return box
    
    def create_mini_stat(self, label: str, value: str):
        """Crear mini estadística"""
        box = QFrame()
        box.setStyleSheet("""
            QFrame {
                background: rgba(255,255,255,0.03);
                padding: 4px;
                border-radius: 4px;
            }
        """)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        box.setLayout(layout)
        
        label_widget = QLabel(label)
        label_widget.setStyleSheet("font-size: 8px; color: #94a3b8;")
        label_widget.setAlignment(Qt.AlignCenter)
        
        value_widget = QLabel(value)
        value_widget.setStyleSheet("font-weight: 700; font-size: 12px;")
        value_widget.setAlignment(Qt.AlignCenter)
        value_widget.setObjectName("stat_value")
        
        layout.addWidget(label_widget)
        layout.addWidget(value_widget)
        
        return box
    
    def create_tracking_section(self, parent_layout):
        """Sección de rastreo OCR"""
        section = CollapsibleSection("Rastreo", "🎯")
        
        # Botones principales
        btn_row = QHBoxLayout()
        self.btn_calibrate_ocr = QPushButton("🔍 Capturar Zona Multiplicador")
        self.btn_calibrate_ocr.setStyleSheet("""
            QPushButton {
                flex: 1;
                min-height: 35px;
                border: 1px solid #22c55e;
            }
        """)
        self.btn_calibrate_ocr.clicked.connect(self.calibrate_ocr.emit)
        
        btn_reset_ocr = QPushButton("🗑️")
        btn_reset_ocr.setMaximumWidth(40)
        btn_reset_ocr.setProperty("class", "secondary")
        
        btn_row.addWidget(self.btn_calibrate_ocr)
        btn_row.addWidget(btn_reset_ocr)
        section.add_widget(self.create_widget_from_layout(btn_row))
        
        # Toggle rastreo
        toggle_row = QHBoxLayout()
        toggle_label = QLabel("Activar Rastreo")
        toggle_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.toggle_ocr = QCheckBox()
        toggle_row.addWidget(toggle_label)
        toggle_row.addStretch()
        toggle_row.addWidget(self.toggle_ocr)
        section.add_widget(self.create_widget_from_layout(toggle_row))
        
        # Status box
        status_box = QFrame()
        status_box.setStyleSheet("""
            QFrame {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 8px;
                margin-top: 8px;
            }
        """)
        status_layout = QVBoxLayout()
        status_box.setLayout(status_layout)
        
        status_header = QHBoxLayout()
        status_header.addWidget(QLabel("Último Valor:"))
        self.python_indicator = QLabel("●")
        self.python_indicator.setStyleSheet("color: #ef4444; font-size: 12px;")
        self.python_indicator.setToolTip("Servidor Python")
        status_header.addStretch()
        status_header.addWidget(self.python_indicator)
        status_layout.addLayout(status_header)
        
        self.ocr_value = QLabel("--")
        self.ocr_value.setStyleSheet("""
            font-size: 20px;
            font-weight: 700;
            text-align: center;
        """)
        self.ocr_value.setAlignment(Qt.AlignCenter)
        status_layout.addWidget(self.ocr_value)
        
        self.ocr_timestamp = QLabel("")
        self.ocr_timestamp.setStyleSheet("font-size: 10px; color: #64748b;")
        self.ocr_timestamp.setAlignment(Qt.AlignRight)
        status_layout.addWidget(self.ocr_timestamp)
        
        section.add_widget(status_box)
        
        # Consola de diagnóstico
        console_header = QHBoxLayout()
        console_label = QLabel("📟 CONSOLA DE DIAGNÓSTICO")
        console_label.setStyleSheet("font-size: 10px; color: #94a3b8;")
        self.fps_label = QLabel("-- fps")
        self.fps_label.setStyleSheet("font-size: 10px; color: #64748b;")
        console_header.addWidget(console_label)
        console_header.addStretch()
        console_header.addWidget(self.fps_label)
        section.add_widget(self.create_widget_from_layout(console_header))
        
        self.console_log = QLabel("> Esperando inicio...")
        self.console_log.setStyleSheet("""
            QLabel {
                background: #000;
                border: 1px solid #334155;
                border-radius: 4px;
                padding: 6px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 10px;
                color: #22c55e;
                min-height: 80px;
            }
        """)
        self.console_log.setWordWrap(True)
        section.add_widget(self.console_log)
        
        parent_layout.addWidget(section)
    
    def create_history_section(self, parent_layout):
        """Sección de historial"""
        section = CollapsibleSection("Historial", "📜")
        
        # Grid de historial
        self.history_container = QFrame()
        self.history_container.setStyleSheet("""
            QFrame {
                background: rgba(255,255,255,0.02);
                border-radius: 4px;
                padding: 5px;
                min-height: 80px;
                max-height: 150px;
            }
        """)
        self.history_layout = QHBoxLayout()
        self.history_layout.setSpacing(5)
        self.history_container.setLayout(self.history_layout)
        section.add_widget(self.history_container)
        
        # Botón limpiar
        btn_clear = QPushButton("Limpiar")
        btn_clear.setStyleSheet("""
            QPushButton {
                background: none;
                color: #94a3b8;
                text-decoration: underline;
                font-size: 11px;
                padding: 4px;
            }
            QPushButton:hover {
                color: #f1f5f9;
            }
        """)
        btn_clear.setMaximumWidth(80)
        clear_layout = QHBoxLayout()
        clear_layout.addStretch()
        clear_layout.addWidget(btn_clear)
        section.add_widget(self.create_widget_from_layout(clear_layout))
        
        parent_layout.addWidget(section)
    
    def create_calibration_section(self, parent_layout):
        """Sección de calibración de botones"""
        section = CollapsibleSection("Calibración de Botones", "⚙️")
        
        # Instrucciones
        instructions = QLabel("""<b>Instrucciones:</b><br>
1. Click "Calibrar".<br>
2. Click en botones de apuesta para añadir puntos.<br>
3. ENTER para Guardar.""")
        instructions.setStyleSheet("""
            font-size: 11px;
            color: #cbd5e1;
            background: rgba(59, 130, 246, 0.1);
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
        """)
        instructions.setWordWrap(True)
        section.add_widget(instructions)
        
        # Botón 1
        btn1_header = QHBoxLayout()
        btn1_label = QLabel("Botón 1 (Izquierda)")
        btn1_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.status_cal_1 = QLabel("No calib.")
        self.status_cal_1.setStyleSheet("""
            background: #ef4444;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
        """)
        btn1_header.addWidget(btn1_label)
        btn1_header.addStretch()
        btn1_header.addWidget(self.status_cal_1)
        section.add_widget(self.create_widget_from_layout(btn1_header))
        
        btn1_controls = QHBoxLayout()
        self.btn_cal_1 = QPushButton("🎯 Calibrar Btn 1")
        self.btn_cal_1.clicked.connect(self.calibrate_btn1.emit)
        btn_reset_1 = QPushButton("🗑️")
        btn_reset_1.setMaximumWidth(30)
        btn_reset_1.setProperty("class", "secondary")
        btn1_controls.addWidget(self.btn_cal_1)
        btn1_controls.addWidget(btn_reset_1)
        section.add_widget(self.create_widget_from_layout(btn1_controls))
        
        # Separador
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("background: rgba(255,255,255,0.05); margin: 8px 0;")
        section.add_widget(sep)
        
        # Botón 2
        btn2_header = QHBoxLayout()
        btn2_label = QLabel("Botón 2 (Derecha)")
        btn2_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.status_cal_2 = QLabel("No calib.")
        self.status_cal_2.setStyleSheet("""
            background: #ef4444;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
        """)
        btn2_header.addWidget(btn2_label)
        btn2_header.addStretch()
        btn2_header.addWidget(self.status_cal_2)
        section.add_widget(self.create_widget_from_layout(btn2_header))
        
        btn2_controls = QHBoxLayout()
        self.btn_cal_2 = QPushButton("🎯 Calibrar Btn 2")
        self.btn_cal_2.clicked.connect(self.calibrate_btn2.emit)
        btn_reset_2 = QPushButton("🗑️")
        btn_reset_2.setMaximumWidth(30)
        btn_reset_2.setProperty("class", "secondary")
        btn2_controls.addWidget(self.btn_cal_2)
        btn2_controls.addWidget(btn_reset_2)
        section.add_widget(self.create_widget_from_layout(btn2_controls))
        
        parent_layout.addWidget(section)
    
    def create_sniper_section(self, parent_layout):
        """Sección Sniper Trigger"""
        section = CollapsibleSection("Sniper Trigger", "🎯")
        
        # Toggle sniper
        sniper_row = QHBoxLayout()
        sniper_label = QLabel("Activar Sniper")
        sniper_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.toggle_sniper = QCheckBox()
        sniper_row.addWidget(sniper_label)
        sniper_row.addStretch()
        sniper_row.addWidget(self.toggle_sniper)
        section.add_widget(self.create_widget_from_layout(sniper_row))
        
        # Toggle sonido
        sound_row = QHBoxLayout()
        sound_label = QLabel("Sonido Alerta")
        sound_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.toggle_sound = QCheckBox()
        sound_row.addWidget(sound_label)
        sound_row.addStretch()
        sound_row.addWidget(self.toggle_sound)
        section.add_widget(self.create_widget_from_layout(sound_row))
        
        parent_layout.addWidget(section)
    
    def create_exponential_section(self, parent_layout):
        """Sección Apuesta Exponencial"""
        section = CollapsibleSection("Apuesta Exponencial", "🚀")
        
        # Sistema 1
        sys1_row = QHBoxLayout()
        sys1_label = QLabel("Sistema 1")
        sys1_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        btn_cal_exp1 = QPushButton("Calibrar")
        btn_cal_exp1.setMaximumWidth(70)
        btn_cal_exp1.setStyleSheet("font-size: 10px; padding: 4px 8px;")
        btn_test_exp1 = QPushButton("Test")
        btn_test_exp1.setMaximumWidth(50)
        btn_test_exp1.setProperty("class", "secondary")
        btn_test_exp1.setStyleSheet("font-size: 10px; padding: 4px 8px;")
        sys1_row.addWidget(sys1_label)
        sys1_row.addStretch()
        sys1_row.addWidget(btn_cal_exp1)
        sys1_row.addWidget(btn_test_exp1)
        section.add_widget(self.create_widget_from_layout(sys1_row))
        
        # Sistema 2
        sys2_row = QHBoxLayout()
        sys2_label = QLabel("Sistema 2")
        sys2_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        btn_cal_exp2 = QPushButton("Calibrar")
        btn_cal_exp2.setMaximumWidth(70)
        btn_cal_exp2.setStyleSheet("font-size: 10px; padding: 4px 8px;")
        btn_test_exp2 = QPushButton("Test")
        btn_test_exp2.setMaximumWidth(50)
        btn_test_exp2.setProperty("class", "secondary")
        btn_test_exp2.setStyleSheet("font-size: 10px; padding: 4px 8px;")
        sys2_row.addWidget(sys2_label)
        sys2_row.addStretch()
        sys2_row.addWidget(btn_cal_exp2)
        sys2_row.addWidget(btn_test_exp2)
        section.add_widget(self.create_widget_from_layout(sys2_row))
        
        # Separador
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("background: rgba(255,255,255,0.05); margin: 5px 0;")
        section.add_widget(sep)
        
        # Toggle post-win
        postwin_row = QHBoxLayout()
        postwin_label = QLabel("Apostar Post-Win (4s)")
        postwin_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        postwin_label.setToolTip("Apostar tras victoria detectada en OCR")
        self.toggle_postwin = QCheckBox()
        postwin_row.addWidget(postwin_label)
        postwin_row.addStretch()
        postwin_row.addWidget(self.toggle_postwin)
        section.add_widget(self.create_widget_from_layout(postwin_row))
        
        parent_layout.addWidget(section)
    
    def create_diagnostic_section(self, parent_layout):
        """Sección de pruebas"""
        section = CollapsibleSection("Pruebas de Funcionamiento", "🧪")
        
        # Nota
        note = QLabel("⚠️ Nota: Los tests realizan <b>clicks reales</b> en las coordenadas calibradas.")
        note.setStyleSheet("""
            font-size: 10px;
            color: #94a3b8;
            margin-bottom: 10px;
        """)
        note.setWordWrap(True)
        section.add_widget(note)
        
        # Grid de tests
        test_grid = QGridLayout()
        test_grid.setSpacing(8)
        
        btn_test_apostar = QPushButton("🖱️ Test Apostar")
        btn_test_apostar.setStyleSheet("font-size: 10px; padding: 4px 8px;")
        btn_test_apostar.clicked.connect(lambda: self.test_click.emit("apostar"))
        
        btn_test_falso = QPushButton("🖱️ Test Falso (A+C)")
        btn_test_falso.setProperty("class", "secondary")
        btn_test_falso.setStyleSheet("font-size: 10px; padding: 4px 8px;")
        btn_test_falso.clicked.connect(lambda: self.test_click.emit("falso"))
        
        btn_test_exp = QPushButton("🚀 Test Exp.")
        btn_test_exp.setStyleSheet("background: #8b5cf6; font-size: 10px; padding: 4px 8px;")
        btn_test_exp.clicked.connect(lambda: self.test_click.emit("exponencial"))
        
        btn_test_reload = QPushButton("🔄 Test Recarga")
        btn_test_reload.setStyleSheet("background: #f59e0b; font-size: 10px; padding: 4px 8px;")
        btn_test_reload.clicked.connect(lambda: self.test_click.emit("reload"))
        
        test_grid.addWidget(btn_test_apostar, 0, 0)
        test_grid.addWidget(btn_test_falso, 0, 1)
        test_grid.addWidget(btn_test_exp, 1, 0)
        test_grid.addWidget(btn_test_reload, 1, 1)
        
        section.add_widget(self.create_widget_from_layout(test_grid))
        
        # Separador
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("background: rgba(255,255,255,0.05); margin: 8px 0;")
        section.add_widget(sep)
        
        # Test audio
        audio_row = QHBoxLayout()
        audio_label = QLabel("Probar Audio de Alerta")
        audio_label.setStyleSheet("color: #94a3b8; font-size: 12px;")
        btn_test_sound = QPushButton("🔊")
        btn_test_sound.setMaximumWidth(40)
        btn_test_sound.setProperty("class", "secondary")
        audio_row.addWidget(audio_label)
        audio_row.addStretch()
        audio_row.addWidget(btn_test_sound)
        section.add_widget(self.create_widget_from_layout(audio_row))
        
        # Status
        self.test_status = QLabel("Listo para diagnóstico.")
        self.test_status.setStyleSheet("""
            font-size: 9px;
            color: #64748b;
            text-align: center;
            margin-top: 8px;
        """)
        self.test_status.setAlignment(Qt.AlignCenter)
        section.add_widget(self.test_status)
        
        parent_layout.addWidget(section)
    
    def create_bypass_section(self, parent_layout):
        """Sección Bypass"""
        section = CollapsibleSection("Bypass de Diálogos", "🛡️")
        
        # Cierres automáticos
        bypass_row1 = QHBoxLayout()
        bypass_label1 = QLabel("Cierres Automáticos:")
        bypass_label1.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.bypass_count = QLabel("0")
        self.bypass_count.setStyleSheet("font-weight: bold; color: #22c55e;")
        bypass_row1.addWidget(bypass_label1)
        bypass_row1.addStretch()
        bypass_row1.addWidget(self.bypass_count)
        section.add_widget(self.create_widget_from_layout(bypass_row1))
        
        # Recargas
        bypass_row2 = QHBoxLayout()
        bypass_label2 = QLabel("Recargas por Sesión:")
        bypass_label2.setStyleSheet("color: #94a3b8; font-size: 12px;")
        self.bypass_reloads = QLabel("0")
        self.bypass_reloads.setStyleSheet("font-weight: bold; color: #f59e0b;")
        bypass_row2.addWidget(bypass_label2)
        bypass_row2.addStretch()
        bypass_row2.addWidget(self.bypass_reloads)
        section.add_widget(self.create_widget_from_layout(bypass_row2))
        
        parent_layout.addWidget(section)
    
    def create_database_section(self, parent_layout):
        """Sección Base de Datos"""
        section = CollapsibleSection("Base de Datos", "🗄️")
        
        # Botón nueva partida
        btn_new_game = QPushButton("✨ Nueva Partida")
        btn_new_game.setStyleSheet("""
            QPushButton {
                background: #10b981;
                min-height: 30px;
            }
            QPushButton:hover {
                background: #059669;
            }
        """)
        btn_new_game.clicked.connect(self.new_session.emit)
        section.add_widget(btn_new_game)
        
        # Botón ver/ocultar datos
        btn_toggle_db = QPushButton("📊 Ver / Ocultar Datos")
        btn_toggle_db.setProperty("class", "secondary")
        section.add_widget(btn_toggle_db)
        
        parent_layout.addWidget(section)
    
    def create_widget_from_layout(self, layout):
        """Helper para crear widget desde layout"""
        widget = QWidget()
        widget.setLayout(layout)
        return widget
    
    def update_session_time(self):
        """Actualizar cronómetro de sesión"""
        elapsed = self.session_start_time.secsTo(QTime.currentTime())
        hours = elapsed // 3600
        minutes = (elapsed % 3600) // 60
        seconds = elapsed % 60
        self.session_timer.setText(f"CRONÓMETRO: {hours:02d}:{minutes:02d}:{seconds:02d}")
    
    def log(self, message: str):
        """Agregar mensaje a la consola"""
        current = self.console_log.text()
        if current == "> Esperando inicio...":
            self.console_log.setText(f"> {message}")
        else:
            lines = current.split('\n')
            if len(lines) > 5:
                lines = lines[-4:]
            lines.append(f"> {message}")
            self.console_log.setText('\n'.join(lines))
    
    def update_stat(self, stat_name: str, value: str):
        """Actualizar estadística"""
        # Buscar el widget por nombre y actualizar
        stat_widgets = {
            'total': self.stat_total,
            'no_bet': self.stat_no_bet,
            'wins': self.stat_wins,
            'losses': self.stat_losses,
            'click_ap': self.stat_click_ap,
            'click_exp': self.stat_click_exp,
            'click_falso': self.stat_click_falso
        }
        
        if stat_name in stat_widgets:
            value_label = stat_widgets[stat_name].findChild(QLabel, "stat_value")
            if value_label:
                value_label.setText(value)
