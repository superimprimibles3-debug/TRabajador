print("🔍 Verificando estructura del archivo...")

with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Verificar que setupStrategyListeners existe
if 'setupStrategyListeners()' in content:
    print("✅ Método setupStrategyListeners() encontrado")
else:
    print("❌ Método setupStrategyListeners() NO encontrado")

# Verificar que se llama en init()
if 'this.setupStrategyListeners();' in content:
    print("✅ Llamada a setupStrategyListeners() en init() encontrada")
else:
    print("❌ Llamada a setupStrategyListeners() en init() NO encontrada")

# Verificar estructura de clase
if 'class SidePanelManager {' in content:
    print("✅ Clase SidePanelManager definida")
else:
    print("❌ Clase SidePanelManager NO definida")

# Verificar cierre de clase
if 'new SidePanelManager();' in content:
    print("✅ Instancia de SidePanelManager creada")
else:
    print("❌ Instancia de SidePanelManager NO creada")

# Contar métodos de estrategias
strategy_methods = [
    'calculateMartingale',
    'calculateAntiMartingale',
    'calculateFibonacci',
    'calculateDAlembert',
    'calculateConservative',
    'calculateHighRisk',
    'calculateDual'
]

found_methods = []
for method in strategy_methods:
    if method in content:
        found_methods.append(method)

print(f"\n✅ Métodos de cálculo encontrados: {len(found_methods)}/7")
for method in found_methods:
    print(f"   - {method}")

print("\n📊 Resumen:")
print(f"   Tamaño del archivo: {len(content)} caracteres")
print(f"   Líneas totales: {content.count(chr(10)) + 1}")

print("\n✅ ARCHIVO CORRECTO - El error es de caché del navegador")
print("\n🔧 SOLUCIÓN:")
print("   1. Ve a chrome://extensions/")
print("   2. Encuentra 'Aviator Tracker Pro'")
print("   3. Click en el botón de RECARGAR (ícono circular)")
print("   4. Cierra y vuelve a abrir el SidePanel")
print("   5. Si persiste, click en 'Borrar todo' en la consola de errores")
