# Sistema de Categorías Personalizadas - Guía de Uso

## 📋 Resumen de Cambios Implementados

### ✅ Problemas Corregidos

1. **Bug de visualización en Presupuestos** 
   - ❌ Antes: Los valores se mostraban en "0gs" al guardar o editar
   - ✅ Ahora: Los valores se cargan correctamente usando `useEffect` para resetear el formulario

2. **Menú de usuario limpiado**
   - ❌ Antes: Había un botón "Actualizar datos" que no hacía nada
   - ✅ Ahora: Botón eliminado del menú desplegable

3. **Sistema de categorías personalizado**
   - ❌ Antes: No había forma clara de crear categorías personalizadas
   - ✅ Ahora: Sistema completo de gestión de categorías en Configuración

---

## 🎯 Cómo Usar el Sistema de Categorías

### Acceso Rápido

Desde la página de **Presupuestos** (`/budgets`):
- Haz clic en el botón **"Categorías"** en la esquina superior derecha
- O haz clic en el enlace **"Configuración"** debajo del título

### Crear una Nueva Categoría

1. Ve a **Configuración** (`/settings`)
2. Haz clic en el botón **"Nueva Categoría"** 
3. Completa el formulario:
   - **Nombre**: Ej. "Comisiones", "Internet", "Gimnasio"
   - **Tipo**: Selecciona "Gasto" o "Ingreso"
   - **Color**: Elige un color para identificarla visualmente
   - **Icono**: Selecciona un emoji representativo
4. Haz clic en **"Crear"**

### Editar una Categoría

1. En la página de Configuración, busca la categoría que deseas editar
2. Pasa el mouse sobre la categoría
3. Haz clic en el ícono de **lápiz** ✏️
4. Modifica los campos necesarios
5. Haz clic en **"Actualizar"**

### Eliminar una Categoría

1. En la página de Configuración, busca la categoría
2. Pasa el mouse sobre la categoría
3. Haz clic en el ícono de **basura** 🗑️
4. Confirma la eliminación

---

## 📊 Usar Categorías en Presupuestos

Una vez que tengas tus categorías creadas:

1. Ve a **Presupuestos** (`/budgets`)
2. Haz clic en **"Nuevo Presupuesto"**
3. Selecciona la categoría del desplegable (ahora incluye tus categorías personalizadas como "Comisiones")
4. Ingresa el monto del presupuesto
5. Selecciona el mes
6. (Opcional) Establece una fecha de fin para presupuestos temporales
7. Haz clic en **"Crear"**

---

## 🔧 Aplicar Migración a Supabase

Si es necesario actualizar la base de datos, ejecuta:

```bash
node scripts/apply-categories-migration.js
```

Este script:
- ✅ Verifica que la tabla de categorías tiene todos los campos necesarios
- ✅ Asegura que las políticas de seguridad (RLS) están configuradas
- ✅ Actualiza categorías existentes con iconos y colores predeterminados
- ✅ Crea índices para mejor rendimiento

---

## 💡 Categorías Predeterminadas

Cuando un usuario se registra, se crean automáticamente estas categorías:

### Categorías de Gastos
- 🍔 Alimentación
- 🚗 Transporte
- 🏠 Vivienda
- 💡 Servicios
- 🎮 Entretenimiento
- 🏥 Salud
- 📚 Educación
- 👕 Ropa
- 📱 Suscripciones
- 💳 Otros gastos

### Categorías de Ingresos
- 💰 Salario
- 💼 Freelance
- 🛒 Ventas
- 📈 Inversiones
- 💵 Otros ingresos

**Los usuarios pueden crear, editar o eliminar cualquiera de estas categorías según sus necesidades.**

---

## 🔐 Seguridad

- Cada usuario solo puede ver y modificar sus propias categorías
- Las políticas RLS (Row Level Security) garantizan la privacidad de los datos
- Las categorías están vinculadas al `user_id` del usuario autenticado

---

## 🚀 Próximos Pasos

Ahora puedes:
1. Crear categorías personalizadas como "Comisiones", "Internet", etc.
2. Asignar presupuestos mensuales a cada categoría
3. Visualizar el progreso de gastos en cada categoría
4. Editar o eliminar categorías según tus necesidades

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que estás autenticado
2. Revisa que la migración se haya ejecutado correctamente
3. Verifica los logs de la consola del navegador para errores
