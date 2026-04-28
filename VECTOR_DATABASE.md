# **Vector Database Implementation - GotaPlus** 🚀

## **Descripción General**

Sistema de base de datos vectorial integrado con MongoDB, Hugging Face y Gemini API para:

- ✅ Subir PDFs con información de clientes
- ✅ Generar embeddings automáticamente
- ✅ Búsqueda semántica de información
- ✅ Respuestas inteligentes con Gemini

---

## **REQUISITOS**

1. **API Keys necesarias:**
   - 🟢 **Hugging Face API Key** (Gratis) - Para generar embeddings
   - 🔵 **Gemini API Key** (Gratis) - Para generar respuestas

2. **Variables de entorno (.env):**

```
HUGGINGFACE_API_KEY=tu_api_key_aqui
GEMINI_API_KEY=tu_api_key_aqui
```

---

## **ENDPOINTS DISPONIBLES**

### **1️⃣ SUBIR PDF**

```
POST /api/vector/upload-pdf
Content-Type: multipart/form-data

Body:
- pdf: archivo.pdf
- tipo: "cliente" | "politica" | "terminos" | "otro"
- nombre: "Nombre del documento"
- cedula_cliente: "1234567890" (opcional)

Response:
{
  "success": true,
  "message": "PDF procesado exitosamente",
  "chunks_procesados": 15,
  "nombre_archivo": "documento.pdf",
  "tipo": "cliente"
}
```

**Ejemplo con cURL:**

```bash
curl -X POST http://localhost:5000/api/vector/upload-pdf \
  -F "pdf=@documento.pdf" \
  -F "tipo=cliente" \
  -F "nombre=Info Cliente Juan"
```

---

### **2️⃣ BUSCAR INFORMACIÓN**

```
POST /api/vector/search
Content-Type: application/json

Body:
{
  "pregunta": "¿Cuál es el monto máximo de crédito?",
  "limite": 5,
  "tipo": "cliente" (opcional)
}

Response:
{
  "success": true,
  "pregunta": "¿Cuál es el monto máximo de crédito?",
  "resultados_encontrados": 3,
  "resultados": [
    {
      "contenido": "El monto máximo de crédito es de $1,000,000",
      "similitud": "92.5%",
      "tipo": "cliente",
      "nombre": "Política de Créditos"
    }
  ]
}
```

---

### **3️⃣ RESPONDER PREGUNTA CON GEMINI** ⭐ RECOMENDADO

```
POST /api/vector/ask
Content-Type: application/json

Body:
{
  "pregunta": "¿Cuál es la edad mínima para solicitar crédito?",
  "limite": 5
}

Response:
{
  "success": true,
  "pregunta": "¿Cuál es la edad mínima para solicitar crédito?",
  "respuesta": "Basándose en la información de la base de datos, la edad mínima para solicitar crédito es de 18 años. Además, el solicitante debe tener un documento de identidad válido y comprobar ingresos.",
  "documentos_utilizados": [
    {
      "nombre": "Requisitos Clientes",
      "contenido": "Edad mínima 18 años, con cédula...",
      "similitud": "94.2%"
    }
  ]
}
```

---

### **4️⃣ LISTAR DOCUMENTOS**

```
GET /api/vector/documents

Response:
{
  "success": true,
  "total": 15,
  "documentos": [
    {
      "_id": "507f...",
      "nombre": "Política de Créditos",
      "tipo": "politica",
      "nombre_archivo": "politicas.pdf",
      "createdAt": "2024-04-27T10:30:00Z",
      "similitud": "84.5%"
    }
  ]
}
```

---

### **5️⃣ ELIMINAR DOCUMENTO**

```
DELETE /api/vector/documents/:id

Response:
{
  "success": true,
  "message": "Documento eliminado"
}
```

---

## **FLUJO COMPLETO: PASO A PASO**

### **Ejemplo: Subir información de clientes**

```bash
# 1. Crear un PDF con información de clientes
# (Luego se sube el archivo)

# 2. Subir el PDF
curl -X POST http://localhost:5000/api/vector/upload-pdf \
  -F "pdf=@clientes_info.pdf" \
  -F "tipo=cliente" \
  -F "nombre=Base de Datos Clientes"

# Respuesta:
# {
#   "success": true,
#   "chunks_procesados": 20,
#   ...
# }

# 3. Buscar información
curl -X POST http://localhost:5000/api/vector/ask \
  -H "Content-Type: application/json" \
  -d '{
    "pregunta": "¿Quién es Juan García y cuál es su límite de crédito?"
  }'

# Respuesta:
# {
#   "success": true,
#   "respuesta": "Juan García es un cliente con cédula 1234567, su límite de crédito es de $500,000..."
# }
```

---

## **CÓMO FUNCIONA INTERNAMENTE**

```
1. PDF UPLOAD
   └─ Parsear PDF → Dividir en chunks (500 caracteres) → Generar embeddings HF

2. ALMACENAMIENTO
   └─ Cada chunk + embedding + metadatos → MongoDB

3. BÚSQUEDA
   └─ Pregunta del usuario → Generar embedding → Buscar similitud coseno → Top 5 resultados

4. RESPUESTA CON GEMINI
   └─ Contexto (documentos similares) + Pregunta → Gemini API → Respuesta inteligente
```

---

## **MODELO DE DATOS**

### **VectorDocument (MongoDB)**

```javascript
{
  _id: ObjectId,
  nombre: String,                  // Nombre del documento
  tipo: String,                    // "cliente", "politica", etc.
  cedula_cliente: String,          // Cédula (si aplica)
  contenido_original: String,      // Texto original del chunk
  vector: [Number],                // Embedding (384 dimensiones)
  modelo_embedding: String,        // "sentence-transformers/all-MiniLM-L6-v2"
  tenant: ObjectId,                // Referencia a tenant
  cobrador: ObjectId,              // Referencia a cobrador
  nombre_archivo: String,          // PDF original
  pagina: Number,                  // Página del PDF
  chunk_index: Number,             // Índice del chunk
  createdAt: Date,
  updatedAt: Date
}
```

---

## **INTEGRACIÓN CON BOT TELEGRAM**

Próximamente se integrará con el bot para que los usuarios puedan:

1. Subir PDFs desde Telegram
2. Hacer preguntas sobre la información
3. Recibir respuestas generadas por Gemini

---

## **TROUBLESHOOTING**

| Problema                  | Solución                                    |
| ------------------------- | ------------------------------------------- |
| Error 401 en Hugging Face | Verifica que HUGGINGFACE_API_KEY sea válida |
| Error 401 en Gemini       | Verifica que GEMINI_API_KEY sea válida      |
| Embeddings muy lentos     | Los primeros uploads son lentos, es normal  |
| Error "No hay tenant"     | Debes tener un tenant creado en MongoDB     |

---

## **PRÓXIMOS PASOS**

- [ ] Integrar con Telegram Bot para upload de PDFs
- [ ] Agregar búsqueda avanzada con filtros
- [ ] Caché de embeddings para queries frecuentes
- [ ] Dashboard de documentos subidos
- [ ] Exportar respuestas a PDF

---

**Versión:** 1.0.0 | **Última actualización:** 27/04/2024
