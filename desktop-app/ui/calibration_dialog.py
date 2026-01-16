"""
Diálogo de calibración para seleccionar región de captura.
Permite al usuario definir el área de la pantalla a capturar.
"""
from PyQt5.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QPushButton,
                             QLabel, QSpinBox, QGroupBox, QFormLayout)
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QFont
import pyautogui

class CalibrationDialog(QDialog):
    """Diálogo para calibrar región de captura"""
    
    # Señal emitida cuando se completa la calibración
    calibration_complete = pyqtSignal(dict)
    
    def __init__(self, parent=None, current_config: dict = None):
        super().__init__(parent)
        self.current_config = current_config or {}
        self.initUI()
    
    def initUI(self):
        """Inicializar interfaz de usuario"""
        self.setWindowTitle("Calibración de Región")
        self.setModal(True)
        self.setMinimumWidth(400)
        
        layout = QVBoxLayout()
        
        # Título
        title = QLabel("🎯 Calibración de Región de Captura")
        title_font = QFont()
        title_font.setPointSize(12)
        title_font.setBold(True)
        title.setFont(title_font)
        layout.addWidget(title)
        
        # Instrucciones
        instructions = QLabel(
            "Haz clic en 'Capturar Posición' y luego haz clic en la esquina "
            "superior izquierda de la región que deseas capturar."
        )
        instructions.setWordWrap(True)
        layout.addWidget(instructions)
        
        # Grupo de coordenadas
        coord_group = QGroupBox("Coordenadas de la Región")
        coord_layout = QFormLayout()
        
        # SpinBoxes para coordenadas
        self.x_spin = QSpinBox()
        self.x_spin.setRange(0, 5000)
        self.x_spin.setValue(self.current_config.get('x', 0))
        
        self.y_spin = QSpinBox()
        self.y_spin.setRange(0, 5000)
        self.y_spin.setValue(self.current_config.get('y', 0))
        
        self.width_spin = QSpinBox()
        self.width_spin.setRange(50, 2000)
        self.width_spin.setValue(self.current_config.get('width', 300))
        
        self.height_spin = QSpinBox()
        self.height_spin.setRange(20, 1000)
        self.height_spin.setValue(self.current_config.get('height', 50))
        
        coord_layout.addRow("X (izquierda):", self.x_spin)
        coord_layout.addRow("Y (arriba):", self.y_spin)
        coord_layout.addRow("Ancho:", self.width_spin)
        coord_layout.addRow("Alto:", self.height_spin)
        
        coord_group.setLayout(coord_layout)
        layout.addWidget(coord_group)
        
        # Botón de captura de posición
        self.capture_btn = QPushButton("🖱️ Capturar Posición del Mouse")
        self.capture_btn.clicked.connect(self.capture_mouse_position)
        layout.addWidget(self.capture_btn)
        
        # Label de estado
        self.status_label = QLabel("")
        self.status_label.setStyleSheet("color: #666; font-style: italic;")
        layout.addWidget(self.status_label)
        
        # Botones de acción
        button_layout = QHBoxLayout()
        
        self.test_btn = QPushButton("🧪 Probar Captura")
        self.test_btn.clicked.connect(self.test_capture)
        button_layout.addWidget(self.test_btn)
        
        self.save_btn = QPushButton("✅ Guardar")
        self.save_btn.clicked.connect(self.save_calibration)
        self.save_btn.setStyleSheet("background-color: #4CAF50; color: white; font-weight: bold;")
        button_layout.addWidget(self.save_btn)
        
        self.cancel_btn = QPushButton("❌ Cancelar")
        self.cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_btn)
        
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
    
    def capture_mouse_position(self):
        """Capturar posición actual del mouse"""
        self.status_label.setText("Esperando 3 segundos... Mueve el mouse a la posición deseada")
        self.capture_btn.setEnabled(False)
        
        # Timer para dar tiempo al usuario
        from PyQt5.QtCore import QTimer
        QTimer.singleShot(3000, self._get_mouse_position)
    
    def _get_mouse_position(self):
        """Obtener posición del mouse después del delay"""
        x, y = pyautogui.position()
        self.x_spin.setValue(x)
        self.y_spin.setValue(y)
        self.status_label.setText(f"✅ Posición capturada: ({x}, {y})")
        self.capture_btn.setEnabled(True)
    
    def test_capture(self):
        """Probar captura con configuración actual"""
        config = self.get_calibration_data()
        self.status_label.setText(
            f"🧪 Probando captura en región: "
            f"X={config['x']}, Y={config['y']}, "
            f"W={config['width']}, H={config['height']}"
        )
        # Aquí podrías agregar lógica para mostrar preview
    
    def save_calibration(self):
        """Guardar calibración y cerrar diálogo"""
        config = self.get_calibration_data()
        self.calibration_complete.emit(config)
        self.accept()
    
    def get_calibration_data(self) -> dict:
        """Obtener datos de calibración actuales"""
        return {
            'x': self.x_spin.value(),
            'y': self.y_spin.value(),
            'width': self.width_spin.value(),
            'height': self.height_spin.value()
        }
