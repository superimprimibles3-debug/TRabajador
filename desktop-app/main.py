"""
Aplicación principal de Aviator Tracker Desktop.
Diseño idéntico a la extensión del navegador.
"""
import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer
from ui.control_panel import ControlPanel
from ui.overlay_window import OverlayWindow
from ui.calibration_dialog import CalibrationDialog
from core.config_manager import ConfigManager
from core.screen_capture import ScreenCapture
from core.ocr_engine import OCREngine
from core.auto_clicker import AutoClicker

class AviatorTrackerApp:
    """Aplicación principal"""
    
    def __init__(self):
        # Inicializar componentes
        self.config_manager = ConfigManager()
        self.screen_capture = ScreenCapture()
        self.ocr_engine = OCREngine(
            self.config_manager.get('ocr.tesseract_path')
        )
        self.auto_clicker = AutoClicker()
        
        # UI
        self.control_panel = ControlPanel()
        self.overlay = OverlayWindow(self.config_manager.config)
        
        # Timer para captura
        self.capture_timer = QTimer()
        self.capture_timer.timeout.connect(self.on_capture_tick)
        
        # Estado
        self.is_capturing = False
        self.session_stats = {
            'total_rounds': 0,
            'no_bet': 0,
            'wins': 0,
            'losses': 0,
            'click_apostar': 0,
            'click_exp': 0,
            'click_falso': 0
        }
        
        # Conectar señales
        self.connect_signals()
        
        # Cargar configuración inicial
        self.load_initial_config()
    
    def connect_signals(self):
        """Conectar señales entre componentes"""
        # Rastreo OCR
        self.control_panel.calibrate_ocr.connect(self.show_calibration_ocr)
        self.control_panel.toggle_ocr.stateChanged.connect(self.toggle_capture)
        
        # Calibración de botones
        self.control_panel.calibrate_btn1.connect(self.calibrate_button_1)
        self.control_panel.calibrate_btn2.connect(self.calibrate_button_2)
        
        # Tests
        self.control_panel.test_click.connect(self.run_test)
        
        # Nueva sesión
        self.control_panel.new_session.connect(self.new_session)
    
    def load_initial_config(self):
        """Cargar configuración inicial"""
        # Cargar región de calibración si existe
        multiplier_region = self.config_manager.get('calibration.multiplier_region')
        if multiplier_region:
            self.overlay.set_capture_region(
                multiplier_region['x'],
                multiplier_region['y'],
                multiplier_region['width'],
                multiplier_region['height']
            )
            self.control_panel.log("✅ Región OCR cargada desde config")
        
        # Configurar OCR
        if self.config_manager.get('ocr.debug', False):
            self.ocr_engine.enable_debug(True)
    
    def show_calibration_ocr(self):
        """Mostrar diálogo de calibración OCR"""
        current_config = self.config_manager.get('calibration.multiplier_region')
        
        dialog = CalibrationDialog(
            self.control_panel,
            current_config
        )
        dialog.calibration_complete.connect(self.on_calibration_ocr_complete)
        dialog.exec_()
    
    def on_calibration_ocr_complete(self, config: dict):
        """Manejar calibración OCR completada"""
        # Guardar en config
        self.config_manager.set('calibration.multiplier_region', config)
        self.config_manager.save()
        
        # Actualizar overlay
        self.overlay.set_capture_region(
            config['x'],
            config['y'],
            config['width'],
            config['height']
        )
        
        self.control_panel.log(
            f"✅ Calibración OCR: X={config['x']}, Y={config['y']}, "
            f"W={config['width']}, H={config['height']}"
        )
    
    def calibrate_button_1(self):
        """Calibrar botón 1"""
        self.control_panel.log("🎯 Calibrando Botón 1...")
        self.control_panel.log("⚠️ Función en desarrollo")
        # TODO: Implementar calibración de botón
    
    def calibrate_button_2(self):
        """Calibrar botón 2"""
        self.control_panel.log("🎯 Calibrando Botón 2...")
        self.control_panel.log("⚠️ Función en desarrollo")
        # TODO: Implementar calibración de botón
    
    def toggle_capture(self, state):
        """Alternar captura de OCR"""
        if state:
            self.start_capture()
        else:
            self.stop_capture()
    
    def start_capture(self):
        """Iniciar captura de OCR"""
        # Verificar que hay región calibrada
        if not self.overlay.capture_region:
            self.control_panel.log("❌ Error: Debes calibrar la región OCR primero")
            self.control_panel.toggle_ocr.setChecked(False)
            return
        
        # Obtener intervalo de configuración
        interval = self.config_manager.get('ocr.interval_ms', 1000)
        
        # Iniciar timer
        self.capture_timer.start(interval)
        self.overlay.set_capturing(True)
        self.is_capturing = True
        
        # Actualizar indicador Python
        self.control_panel.python_indicator.setStyleSheet("color: #22c55e; font-size: 12px;")
        
        self.control_panel.log(f"▶️ Captura iniciada (intervalo: {interval}ms)")
    
    def stop_capture(self):
        """Detener captura de OCR"""
        self.capture_timer.stop()
        self.overlay.set_capturing(False)
        self.is_capturing = False
        
        # Actualizar indicador Python
        self.control_panel.python_indicator.setStyleSheet("color: #ef4444; font-size: 12px;")
        
        self.control_panel.log("⏹️ Captura detenida")
    
    def on_capture_tick(self):
        """Ejecutar captura de OCR (llamado por timer)"""
        region = self.overlay.capture_region
        if not region:
            return
        
        # Capturar pantalla
        img = self.screen_capture.capture_region(
            region['x'],
            region['y'],
            region['width'],
            region['height']
        )
        
        if not img:
            self.control_panel.log("⚠️ Error capturando pantalla")
            return
        
        # Procesar OCR
        result = self.ocr_engine.extract_multiplier(img)
        
        if result:
            multiplier, confidence = result
            
            # Verificar umbral de confianza
            min_confidence = self.config_manager.get('ocr.confidence_threshold', 0.7)
            
            if confidence >= min_confidence:
                # Actualizar UI
                self.control_panel.ocr_value.setText(f"{multiplier}x")
                from datetime import datetime
                timestamp = datetime.now().strftime("%H:%M:%S")
                self.control_panel.ocr_timestamp.setText(timestamp)
                
                self.control_panel.log(
                    f"📊 {multiplier}x (conf: {confidence:.0%})"
                )
                
                # Incrementar contador de rondas
                self.session_stats['total_rounds'] += 1
                self.update_stats()
                
                # TODO: Enviar a backend si está habilitado
            else:
                self.control_panel.log(
                    f"⚠️ Baja confianza: {multiplier}x ({confidence:.0%})"
                )
    
    def run_test(self, test_type: str):
        """Ejecutar test de click"""
        self.control_panel.log(f"🧪 Ejecutando test: {test_type}")
        self.control_panel.test_status.setText(f"Ejecutando test {test_type}...")
        
        if test_type == "apostar":
            self.session_stats['click_apostar'] += 1
            self.control_panel.log("🖱️ Click en botón Apostar")
        elif test_type == "falso":
            self.session_stats['click_falso'] += 1
            self.control_panel.log("🖱️ Click Falso (A+C)")
        elif test_type == "exponencial":
            self.session_stats['click_exp'] += 1
            self.control_panel.log("🚀 Click Exponencial")
        elif test_type == "reload":
            self.control_panel.log("🔄 Test Recarga")
        
        self.update_stats()
        
        # Resetear status después de 2 segundos
        QTimer.singleShot(2000, lambda: self.control_panel.test_status.setText("Listo para diagnóstico."))
    
    def new_session(self):
        """Iniciar nueva sesión"""
        # Resetear estadísticas
        self.session_stats = {
            'total_rounds': 0,
            'no_bet': 0,
            'wins': 0,
            'losses': 0,
            'click_apostar': 0,
            'click_exp': 0,
            'click_falso': 0
        }
        
        # Actualizar UI
        self.update_stats()
        
        # Incrementar número de partida
        current = self.control_panel.partida_number.text()
        num = int(current.replace('#', ''))
        self.control_panel.partida_number.setText(f"#{num + 1}")
        
        # Resetear cronómetro
        from PyQt5.QtCore import QTime
        self.control_panel.session_start_time = QTime.currentTime()
        
        self.control_panel.log("✨ Nueva sesión iniciada")
    
    def update_stats(self):
        """Actualizar estadísticas en UI"""
        self.control_panel.update_stat('total', str(self.session_stats['total_rounds']))
        self.control_panel.update_stat('no_bet', str(self.session_stats['no_bet']))
        self.control_panel.update_stat('wins', str(self.session_stats['wins']))
        self.control_panel.update_stat('losses', str(self.session_stats['losses']))
        self.control_panel.update_stat('click_ap', str(self.session_stats['click_apostar']))
        self.control_panel.update_stat('click_exp', str(self.session_stats['click_exp']))
        self.control_panel.update_stat('click_falso', str(self.session_stats['click_falso']))
    
    def run(self):
        """Ejecutar aplicación"""
        self.control_panel.show()
        self.overlay.show()
        self.control_panel.log("🚀 Aviator Tracker Desktop iniciado")
        self.control_panel.log("💡 Calibra la región OCR para comenzar")

def main():
    """Punto de entrada principal"""
    app = QApplication(sys.argv)
    app.setApplicationName("Aviator Tracker Desktop")
    
    # Estilo global de la aplicación
    app.setStyle("Fusion")
    
    # Crear y ejecutar aplicación
    tracker_app = AviatorTrackerApp()
    tracker_app.run()
    
    # Event loop
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
