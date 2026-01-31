# Error Handling Guide - Prism Protocol SDK

## Errores Comunes y Soluciones

### 1. Wallet Connection Errors (Esperados) ✅

**Error**: `WalletConnectionError: User rejected the request`

**Causa**: El usuario canceló la conexión de wallet

**Solución**: ✅ **Ya manejado** - Estos errores son normales y se silencian automáticamente. No requieren acción.

**Código**: `apps/demo/pages/_app.tsx` - Error handler silencia estos errores

---

### 2. "Transaction already been processed" ⚠️

**Error**: `Transaction simulation failed: This transaction has already been processed`

**Causa**: 
- La transacción se procesó en un intento anterior
- React strict mode causa doble renderizado
- Race condition entre múltiples llamadas

**Solución**: ✅ **Ya manejado** - El SDK ahora:
1. Verifica el estado on-chain antes de enviar transacciones
2. Maneja errores "already processed" como éxito si la operación se completó
3. Retry logic para verificar que las cuentas se crearon correctamente

**Archivos modificados**:
- `apps/demo/lib/usePrismProgram.ts`:
  - `createRootIdentity()` - Pre-check + error handling mejorado
  - `createContext()` - Pre-check + retry logic
  - `revokeContext()` - Pre-check + error handling mejorado

---

### 3. Root Identity Creation Fails First Time 🔧

**Síntoma**: Primera creación de contexto falla, segunda vez funciona

**Causa**: 
- Root identity se crea pero no está confirmado cuando se intenta crear el contexto
- Race condition entre creación y verificación

**Solución**: ✅ **Mejorado** - Ahora:
1. Pre-check verifica si root identity ya existe
2. Retry logic con 3 intentos y delays incrementales
3. Espera 3 segundos después de crear root identity
4. Verifica múltiples veces antes de fallar

**Código**:
```typescript
// Espera más tiempo para primera creación
await new Promise(r => setTimeout(r, 3000));

// Retry logic
let retries = 3;
while (retries > 0 && !rootIdentity) {
  rootIdentity = await fetchRootIdentity();
  if (!rootIdentity) {
    await new Promise(r => setTimeout(r, 1000));
    retries--;
  }
}
```

---

## Mejoras Implementadas

### ✅ Pre-checks Antes de Transacciones

Todas las funciones ahora verifican el estado on-chain antes de enviar transacciones:

```typescript
// Root Identity
const existing = await fetchRootIdentity();
if (existing) return { signature: 'existing', pda: result.pda };

// Context
const contextAccount = await fetchContextIdentity(contextResult.pda);
if (contextAccount?.revoked) return { signature: 'already_revoked' };
```

### ✅ Manejo Inteligente de Errores

Los errores "already processed" ahora:
1. Verifican el estado on-chain
2. Retornan éxito si la operación se completó
3. Solo fallan si realmente hay un problema

### ✅ Retry Logic

Para operaciones críticas (crear root identity):
- 3 intentos con delays incrementales
- Verificación del estado después de cada intento
- Mensajes de log claros

---

## Para Desarrolladores del SDK

### Cómo Manejar Errores en Nuevas Funciones

```typescript
async function myFunction() {
  // 1. Pre-check: Verifica estado antes de transacción
  const existing = await checkIfExists();
  if (existing) return { success: true, alreadyExists: true };
  
  try {
    // 2. Intenta la transacción
    const signature = await program.methods
      .myInstruction()
      .rpc();
    
    return { success: true, signature };
  } catch (err: any) {
    // 3. Maneja "already processed"
    if (err.message?.includes('already been processed')) {
      const state = await checkState();
      if (state.isComplete) {
        return { success: true, signature: 'duplicate' };
      }
    }
    
    // 4. Otros errores
    throw err;
  }
}
```

### Patrones de Error Handling

1. **Pre-check siempre**: Verifica estado antes de transacciones
2. **Maneja "already processed"**: Puede ser éxito, no siempre error
3. **Retry para operaciones críticas**: Con delays y límites
4. **Logs claros**: Para debugging pero no spam

---

## Testing

Para probar el manejo de errores:

1. **Root Identity Duplicado**:
   - Crea root identity
   - Intenta crear de nuevo → Debe retornar "existing"

2. **Context Ya Revocado**:
   - Revoca un context
   - Intenta revocar de nuevo → Debe retornar "already_revoked"

3. **Race Conditions**:
   - Crea contexto rápidamente dos veces
   - Primera debe funcionar, segunda debe manejar "already processed"

---

## Notas para Producción

1. **Wallet Errors**: Los errores de wallet rejection son normales - no loguear como errores
2. **Transaction Errors**: Siempre verificar estado on-chain antes de reportar error
3. **Retry Logic**: Usar solo para operaciones críticas, con límites claros
4. **User Experience**: Mostrar mensajes claros, no errores técnicos

---

## Estado Actual

✅ **Completado**:
- Pre-checks para todas las operaciones
- Manejo de "already processed"
- Retry logic para root identity
- Wallet error handling

⚠️ **Pendiente** (Opcional):
- Métricas de errores
- Error reporting service
- User-friendly error messages en UI
