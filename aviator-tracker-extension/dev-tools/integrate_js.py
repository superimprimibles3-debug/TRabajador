import re

# Leer el archivo JS
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# PARTE 1: Agregar al constructor (después de this.init();)
constructor_insert = """
        this.activeStrategy = 'none';
        this.strategies = {
            martingale: {
                baseBet: 100,
                target: 2.0,
                maxDoubles: 5,
                currentBet: 100,
                lossStreak: 0
            },
            anti_martingale: {
                baseBet: 100,
                target: 2.0,
                maxWins: 3,
                currentBet: 100,
                winStreak: 0
            },
            fibonacci: {
                baseBet: 100,
                target: 2.0,
                maxPosition: 8,
                currentPosition: 0,
                sequence: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
            },
            dalembert: {
                baseBet: 100,
                increment: 50,
                target: 2.0,
                minBet: 50,
                currentBet: 100
            },
            conservative: {
                bet: 200,
                target1: 1.50,
                target2: 2.00,
                alternate: true,
                useTarget1: true
            },
            high_risk: {
                bankroll: 5000,
                percent: 5,
                target: 10.00,
                stopLoss: 30,
                initialBankroll: 5000
            },
            dual: {
                bet1: 150,
                target1: 1.50,
                bet2: 50,
                target2: 8.00
            }
        };
"""

# Insertar en el constructor
js_content = js_content.replace('        this.init();', '        this.init();' + constructor_insert)

# PARTE 2: Leer métodos del snippet
with open(r'd:\Trabajador\aviator-tracker-extension\strategies_js_snippet.txt', 'r', encoding='utf-8') as f:
    snippet_content = f.read()

# Extraer PARTE 2 (métodos)
match = re.search(r'// PARTE 2:.*?\n// ============================================\n(.*?)// ============================================', snippet_content, re.DOTALL)
if match:
    methods_insert = match.group(1)
    
    # Insertar después de setupEventListeners()
    pattern = r'(    setupEventListeners\(\) \{[^}]+\})\n'
    replacement = r'\1\n' + methods_insert
    js_content = re.sub(pattern, replacement, js_content, count=1)

# PARTE 3: Agregar llamada en init()
js_content = js_content.replace('        this.setupEventListeners();', '        this.setupEventListeners();\n        this.setupStrategyListeners();')

# Guardar el archivo modificado
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("✅ JavaScript actualizado correctamente")
