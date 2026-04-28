const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Genera una respuesta usando Gemini basada en documentos encontrados
 * @param {string} pregunta - Pregunta del usuario
 * @param {Array} documentosRelacionados - Documentos vectoriales encontrados
 * @returns {Promise<string>} Respuesta generada
 */
async function generarRespuesta(pregunta, documentosRelacionados = []) {
  try {
    // Construir el contexto con los documentos encontrados
    let contexto = "";
    if (documentosRelacionados && documentosRelacionados.length > 0) {
      contexto = `
Basándote en la siguiente información de la base de datos de clientes:

${documentosRelacionados
  .map(
    (doc, i) =>
      `Documento ${i + 1} (Similitud: ${doc.similitud}):
${doc.contenido_original}`,
  )
  .join("\n---\n")}

${
  documentosRelacionados.length > 0
    ? `Responde la siguiente pregunta basándote PRINCIPALMENTE en la información anterior. Si no encuentras la información, responde de manera general.`
    : `No se encontró información específica. Responde de manera general.`
}

Pregunta: ${pregunta}

Proporciona una respuesta clara, concisa y profesional.`;
    } else {
      contexto = `Pregunta: ${pregunta}\n\nProporciona una respuesta clara y profesional.`;
    }

    // Llamar a Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: contexto,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    // Extraer la respuesta
    const respuesta = response.data.candidates[0].content.parts[0].text;
    return respuesta;
  } catch (error) {
    console.error("[ERROR] Error con Gemini API:", error.message);
    throw new Error(`Error generando respuesta: ${error.message}`);
  }
}

/**
 * Procesa una pregunta completa: busca vectores + genera respuesta con Gemini
 * @param {Function} buscarVectores - Función para buscar vectores
 * @param {string} pregunta - Pregunta del usuario
 * @param {string} tenantId - ID del tenant
 * @returns {Promise<Object>} Respuesta procesada
 */
async function procesarPregunta(buscarVectores, pregunta, tenantId) {
  try {
    // 1. Buscar documentos relacionados
    console.log("🔍 Buscando documentos relacionados...");
    const documentosRelacionados = await buscarVectores(pregunta, tenantId);

    // 2. Generar respuesta con Gemini
    console.log("💭 Generando respuesta con Gemini...");
    const respuesta = await generarRespuesta(pregunta, documentosRelacionados);

    return {
      success: true,
      pregunta,
      documentos_encontrados: documentosRelacionados.length,
      respuesta,
      fuentes: documentosRelacionados.map((doc) => ({
        nombre: doc.nombre,
        similitud: doc.similitud,
      })),
    };
  } catch (error) {
    console.error("[ERROR] Error procesando pregunta:", error);
    throw error;
  }
}

module.exports = {
  generarRespuesta,
  procesarPregunta,
};
