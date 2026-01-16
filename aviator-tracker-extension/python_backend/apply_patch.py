import re

# Leer el archivo actual
with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Definir la nueva función
new_function = '''
def execute_stealth_click(slot_id):
    """Ejecuta click aleatorio desde puntos calibrados con jitter."""
    try:
        conn = get_db_connection()
        row = conn.execute('SELECT coords FROM calibration WHERE slot_id = ?', (slot_id,)).fetchone()
        conn.close()
        
        if not row or not row['coords']:
            add_log(f"Slot {slot_id} no calibrado", "ERROR")
            return False
            
        points = json.loads(row['coords'])
        if not points:
            return False
            
        # Elegir punto aleatorio (Multi-Punto)
        point = random.choice(points)
        x, y = point['x'], point['y']
        
        # Anadir Jitter (+/- 4px)
        x += random.randint(-4, 4)
        y += random.randint(-4, 4)
        
        # Movimiento humano
        pyautogui.moveTo(x, y, duration=random.uniform(0.18, 0.45), tween=pyautogui.easeOutQuad)
        pyautogui.mouseDown()
        time.sleep(random.uniform(0.06, 0.14))
        pyautogui.mouseUp()
        
        add_log(f"Click ejecutado en slot {slot_id}: ({x}, {y})")
        return True
    except Exception as e:
        add_log(f"Error en Click Sigiloso: {str(e)}", "ERROR")
        return False

'''

# Nueva función /click
new_click = '''@app.route('/click', methods=['POST'])
def click():
    data = request.json
    slot_id = data.get('slot_id', 'btn1')
    success = execute_stealth_click(slot_id)
    return jsonify({"success": success})'''

# Insertar execute_stealth_click antes de @app.route('/click')
if "def execute_stealth_click" not in content:
    content = content.replace(
        "@app.route('/click', methods=['POST'])",
        new_function + "\n@app.route('/click', methods=['POST'])"
    )
    print("Funcion execute_stealth_click agregada")
else:
    print("Funcion execute_stealth_click ya existe")

# Reemplazar la función click antigua con la nueva
if "slot_id = data.get('slot_id'" not in content:
    content = re.sub(
        r"@app\.route\('/click', methods=\['POST'\]\)\ndef click\(\):.*?return jsonify\(\{\"error\": str\(e\)\}\), 500",
        new_click,
        content,
        flags=re.DOTALL
    )
    print("Ruta /click actualizada")
else:
    print("Ruta /click ya actualizada")

# Guardar el archivo modificado
with open('server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Parche aplicado exitosamente")
