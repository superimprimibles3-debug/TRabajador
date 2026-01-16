import csv
from datetime import datetime, timedelta, timezone

def simulate():
    file_path = r'D:\Trabajador\aviator-tracker-extension\aviator_history_1767100224008.csv'
    
    data = []
    try:
        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append({
                    'Timestamp': datetime.fromisoformat(row['Timestamp'].replace('Z', '+00:00')),
                    'Multiplier': float(row['Multiplier'])
                })
    except Exception as e:
        print(f"Error cargando el archivo: {e}")
        return
    
    # Parámetros Globales
    BASE_BET = 100
    TARGET = 2.0
    MAX_DOUBLES = 5
    
    # Estado de la Simulación
    balance = 0
    total_bets = 0
    wins = 0
    losses = 0
    current_bet = BASE_BET
    loss_streak = 0
    consecutive_wins = 0
    
    # Estado del Sniper
    waiting_for_confirmation = False
    
    # Estado de Bloqueos (Lockdowns)
    lockdown_until = datetime.min.replace(tzinfo=timezone.utc)
    
    results_log = []
    
    for i in range(len(data)):
        row = data[i]
        curr_time = row['Timestamp']
        multiplier = row['Multiplier']
        
        # 1. Verificar Bloqueo Activo
        is_locked = curr_time < lockdown_until
        
        # 2. Monitor de Volatilidad (Filtro B) - Últimos 15
        if i >= 15:
            last_15 = data[i-15:i]
            high_risk_count = sum(1 for r in last_15 if r['Multiplier'] < 1.05)
            if high_risk_count >= 3 and not is_locked:
                lockdown_until = curr_time + timedelta(minutes=30)
                results_log.append(f"[{curr_time}] 🛑 LOCKDOWN: Alta Volatilidad ({high_risk_count}/15 < 1.05). Bloqueo 30 min.")
                is_locked = True
        
        if is_locked:
            waiting_for_confirmation = False
            continue

        # 3. Lógica Sniper Trigger (Filtro A)
        if not waiting_for_confirmation:
            if multiplier < 1.12:
                waiting_for_confirmation = True
        else:
            if multiplier > 1.25:
                # SE CONFIRMA EL GATILLO. Apostamos en el PRÓXIMO round disponible
                if i + 1 < len(data):
                    next_row = data[i+1]
                    next_multiplier = next_row['Multiplier']
                    next_time = next_row['Timestamp']
                    
                    actual_bet_for_log = current_bet
                    total_bets += 1
                    if next_multiplier >= TARGET:
                        profit = (current_bet * TARGET) - current_bet
                        balance += profit
                        wins += 1
                        consecutive_wins += 1
                        loss_streak = 0
                        current_bet = BASE_BET
                        status = "✅ GANADA"
                    else:
                        profit = -current_bet
                        balance += profit
                        losses += 1
                        consecutive_wins = 0
                        loss_streak += 1
                        status = "❌ PERDIDA"
                        
                        if loss_streak <= MAX_DOUBLES:
                            current_bet = current_bet * 2
                        else:
                            current_bet = BASE_BET
                            loss_streak = 0
                    
                    results_log.append(f"[{next_time}] 🚀 APUESTA: {actual_bet_for_log} ARS | Result: {next_multiplier}x | {status} | Balance: {balance:,.2f} | Racha: {consecutive_wins}")
                    
                    # 4. Protección tras ganancia (Filtro C)
                    if consecutive_wins >= 3:
                        lockdown_until = next_time + timedelta(minutes=15)
                        results_log.append(f"[{next_time}] 🛡️ LOCKDOWN: Win Protection (3 consecutivas). Bloqueo 15 min.")
                        consecutive_wins = 0
                
                waiting_for_confirmation = False
            else:
                waiting_for_confirmation = False

    # Imprimir Reporte
    print("\n" + "="*70)
    print("      REPORTE DE SIMULACIÓN PROFESIONAL: AVIATOR TRACKER PRO v1.1.0")
    print("="*70)
    print(f"Total de rounds en historial:   {len(data)}")
    print(f"Estrategia de inversión:        Martingala (Base $100, Target 2.0x)")
    print("-" * 70)
    print(f"Total de apuestas ejecutadas:   {total_bets}")
    print(f"Operaciones con éxito (Wins):   {wins}")
    print(f"Operaciones fallidas (Losses):   {losses}")
    print(f"Tasa de éxito (Win Rate):       {(wins/total_bets*100):.2f}%" if total_bets > 0 else "0.00%")
    print("-" * 70)
    print(f"Balance Final Neto:             {balance:,.2f} ARS")
    print(f"ROI sobre capital apostado:     {(balance / (total_bets * BASE_BET) * 100 if total_bets > 0 else 0):.2f}%")
    print("="*70)
    print("\nHISTORIAL CRÍTICO DE OPERACIONES Y BLOQUEOS:")
    print("-" * 70)
    for log in results_log:
        print(log)

if __name__ == "__main__":
    simulate()
