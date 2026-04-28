const express = require("express");
const multer = require("multer");
const VectorDocument = require("../models/VectorDocument");
const Tenant = require("../models/Tenant");
const Collaborator = require("../models/Collaborator");
const {
  parsePDF,
  dividirEnChunks,
  generarEmbedding,
  buscarDocumentosSimilares,
} = require("../services/vectorService");
const { generarRespuesta } = require("../services/geminiService");

const router = express.Router();

// Configurar multer para recibir archivos
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * 📤 SUBIR PDF Y GENERAR VECTORES
 * POST /api/vector/upload-pdf
 */
router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió archivo" });
    }

    const { tipo, cedula_cliente, nombre } = req.body;

    if (!tipo || !nombre) {
      return res.status(400).json({ error: "Faltan campos: tipo, nombre" });
    }

    // Obtener tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    // Parsear PDF
    console.log("📄 Parseando PDF...");
    const textoPDF = await parsePDF(req.file.buffer);

    // Dividir en chunks
    console.log("🔪 Dividiendo en chunks...");
    const chunks = dividirEnChunks(textoPDF, 500);

    console.log(`📦 ${chunks.length} chunks generados`);

    // Generar embeddings para cada chunk
    const documentosVectoriales = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`🤗 Generando embedding ${i + 1}/${chunks.length}...`);

        const embedding = await generarEmbedding(chunks[i]);

        const documento = new VectorDocument({
          nombre,
          tipo,
          cedula_cliente,
          contenido_original: chunks[i],
          vector: embedding,
          tenant: tenant._id,
          nombre_archivo: req.file.originalname,
          chunk_index: i,
        });

        documentosVectoriales.push(documento);
      } catch (error) {
        console.error(`❌ Error en chunk ${i}: ${error.message}`);
        // Continuar con los siguientes chunks
      }
    }

    // Guardar todos los documentos
    console.log("💾 Guardando en MongoDB...");
    await VectorDocument.insertMany(documentosVectoriales);

    res.json({
      success: true,
      message: `PDF procesado exitosamente`,
      chunks_procesados: documentosVectoriales.length,
      nombre_archivo: req.file.originalname,
      tipo,
    });
  } catch (error) {
    console.error("[ERROR] Error subiendo PDF:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🔍 BUSCAR INFORMACIÓN VECTORIALMENTE
 * POST /api/vector/search
 */
router.post("/search", async (req, res) => {
  try {
    const { pregunta, limite = 5, tipo } = req.body;

    if (!pregunta) {
      return res.status(400).json({ error: "Falta el campo 'pregunta'" });
    }

    // Obtener tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    // Generar embedding de la pregunta
    console.log("🔍 Procesando pregunta...");
    const vectorPregunta = await generarEmbedding(pregunta);

    // Buscar documentos similares
    console.log("📚 Buscando documentos similares...");
    let query = { tenant: tenant._id };
    if (tipo) {
      query.tipo = tipo;
    }

    const documentos = await VectorDocument.find(query).lean();

    // Calcular similitudes
    const resultados = documentos
      .map((doc) => {
        // Calcular similitud coseno
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (let i = 0; i < vectorPregunta.length; i++) {
          dotProduct += vectorPregunta[i] * doc.vector[i];
          mag1 += vectorPregunta[i] * vectorPregunta[i];
          mag2 += doc.vector[i] * doc.vector[i];
        }

        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);
        const similitud =
          mag1 === 0 || mag2 === 0 ? 0 : dotProduct / (mag1 * mag2);

        return { ...doc, similitud };
      })
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, limite)
      .filter((doc) => doc.similitud > 0.3);

    res.json({
      success: true,
      pregunta,
      resultados_encontrados: resultados.length,
      resultados: resultados.map((r) => ({
        contenido: r.contenido_original,
        similitud: (r.similitud * 100).toFixed(2) + "%",
        tipo: r.tipo,
        nombre: r.nombre,
      })),
    });
  } catch (error) {
    console.error("[ERROR] Error buscando:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📋 LISTAR DOCUMENTOS VECTORIALES
 * GET /api/vector/documents
 */
router.get("/documents", async (req, res) => {
  try {
    const tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    const documentos = await VectorDocument.find({
      tenant: tenant._id,
    })
      .select("-vector") // Excluir vectors para no devolver arrays muy grandes
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: documentos.length,
      documentos,
    });
  } catch (error) {
    console.error("[ERROR] Error listando documentos:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🗑️ ELIMINAR DOCUMENTO VECTORIAL
 * DELETE /api/vector/documents/:id
 */
router.delete("/documents/:id", async (req, res) => {
  try {
    const documento = await VectorDocument.findByIdAndDelete(req.params.id);

    if (!documento) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    res.json({
      success: true,
      message: "Documento eliminado",
    });
  } catch (error) {
    console.error("[ERROR] Error eliminando documento:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 💭 RESPONDER PREGUNTA CON GEMINI
 * POST /api/vector/ask
 * Busca documentos relacionados y usa Gemini para generar una respuesta
 */
router.post("/ask", async (req, res) => {
  try {
    const { pregunta, limite = 5 } = req.body;

    if (!pregunta) {
      return res.status(400).json({ error: "Falta el campo 'pregunta'" });
    }

    // Obtener tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      return res.status(400).json({ error: "No hay tenant configurado" });
    }

    // 1. Generar embedding de la pregunta
    console.log("🔍 Procesando pregunta...");
    const vectorPregunta = await generarEmbedding(pregunta);

    // 2. Buscar documentos similares
    console.log("📚 Buscando documentos similares...");
    const documentos = await VectorDocument.find({
      tenant: tenant._id,
    }).lean();

    const documentosSimilares = documentos
      .map((doc) => {
        // Calcular similitud coseno
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (let i = 0; i < vectorPregunta.length; i++) {
          dotProduct += vectorPregunta[i] * doc.vector[i];
          mag1 += vectorPregunta[i] * vectorPregunta[i];
          mag2 += doc.vector[i] * doc.vector[i];
        }

        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);
        const similitud =
          mag1 === 0 || mag2 === 0 ? 0 : dotProduct / (mag1 * mag2);

        return { ...doc, similitud };
      })
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, limite)
      .filter((doc) => doc.similitud > 0.2);

    // 3. Generar respuesta con Gemini
    console.log("💭 Generando respuesta con Gemini...");
    const respuesta = await generarRespuesta(pregunta, documentosSimilares);

    res.json({
      success: true,
      pregunta,
      respuesta,
      documentos_utilizados: documentosSimilares.map((doc) => ({
        nombre: doc.nombre,
        contenido: doc.contenido_original.substring(0, 100) + "...",
        similitud: (doc.similitud * 100).toFixed(2) + "%",
      })),
    });
  } catch (error) {
    console.error("[ERROR] Error respondiendo pregunta:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
