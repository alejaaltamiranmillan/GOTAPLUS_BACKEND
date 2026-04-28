const mongoose = require("mongoose");

// Esquema para almacenar documentos vectoriales
const vectorDocumentSchema = new mongoose.Schema(
  {
    // Metadatos
    nombre: {
      type: String,
      required: true,
      description: "Nombre del documento",
    },
    tipo: {
      type: String,
      enum: ["cliente", "politica", "terminos", "otro"],
      default: "otro",
      description: "Tipo de documento",
    },
    cedula_cliente: {
      type: String,
      description: "Cédula del cliente (si aplica)",
    },

    // Contenido original
    contenido_original: {
      type: String,
      description: "Texto original del documento",
    },

    // Vector (embedding)
    vector: {
      type: [Number],
      required: true,
      description: "Embedding generado por Hugging Face",
    },

    // Metadatos del vector
    modelo_embedding: {
      type: String,
      default: "sentence-transformers/all-MiniLM-L6-v2",
      description: "Modelo usado para generar el embedding",
    },

    // Referencia a tenant y cobrador
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    cobrador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collaborator",
    },

    // Información del PDF
    nombre_archivo: {
      type: String,
      description: "Nombre del archivo PDF original",
    },
    pagina: {
      type: Number,
      description: "Número de página (si es chunk)",
    },
    chunk_index: {
      type: Number,
      description: "Índice del chunk dentro del documento",
    },

    // Similitud (se calcula en búsquedas)
    similitud: {
      type: Number,
      description: "Puntuación de similitud (0-1)",
    },
  },
  { timestamps: true },
);

// Índice para búsquedas vectoriales más rápidas
vectorDocumentSchema.index({ tenant: 1, tipo: 1 });
vectorDocumentSchema.index({ cedula_cliente: 1 });

module.exports = mongoose.model("VectorDocument", vectorDocumentSchema);
