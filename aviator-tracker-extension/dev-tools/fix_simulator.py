print("🔧 Corrigiendo formato de números en simulator.js...")

# Leer archivo
with open(r'd:\Trabajador\aviator-tracker-extension\simulator.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Correcciones de formato
corrections = {
    # Línea 66 - Resultado Bet 1 con 2 decimales
    "r1.toFixed(0)": "r1.toFixed(2)",
    
    # Línea 67 - Resultado Bet 2 con 2 decimales
    "r2.toFixed(0)": "r2.toFixed(2)",
    
    # Línea 68 - Neto con 2 decimales
    "net.toFixed(0)": "net.toFixed(2)",
    
    # Línea 69 - Balance con 2 decimales
    "balance.toFixed(0)": "balance.toFixed(2)",
    
    # Línea 86 - Porcentaje con 2 decimales
    ".toFixed(1)}%)": ".toFixed(2)}%)"
}

for old, new in corrections.items():
    content = content.replace(old, new)

# Guardar
with open(r'd:\Trabajador\aviator-tracker-extension\simulator.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Correcciones aplicadas:")
print("   - Resultados de apuestas: 2 decimales")
print("   - Balance: 2 decimales")
print("   - Porcentajes: 2 decimales")
print("   - Todos los valores usan punto (.) como separador decimal")
print("\n🔄 Recarga la extensión para ver los cambios")
