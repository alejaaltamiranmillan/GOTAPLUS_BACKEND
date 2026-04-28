const pdfParse = require("pdf-parse");
const { HfInference } = require("@huggingface/inference");

// Inicializar Hugging Face
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Modelo de embeddings
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/**
 * Parsea un PDF y extrae el texto
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @returns {Promise<string>} Texto extraído
 */
async function parsePDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error parseando PDF: ${error.message}`);
  }
}

/**
 * Divide el texto en chunks de tamaño manejable
 * @param {string} texto - Texto a dividir
 * @param {number} tamanio - Tamaño de cada chunk
 * @returns {string[]} Array de chunks
 */
function dividirEnChunks(texto, tamanio = 500) {
  const chunks = [];
  for (let i = 0; i < texto.length; i += tamanio) {
    chunks.push(texto.slice(i, i + tamanio));
  }
  return chunks;
}

/**
 * Genera embedding (vector) para un texto usando Hugging Face
 * @param {string} texto - Texto a vectorizar
 * @returns {Promise<number[]>} Array de números (vector)
 */
async function generarEmbedding(texto) {
  try {
    const embedding = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: texto,
    });

    // HF devuelve [[...]], extraemos el primer array
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
  } catch (error) {
    throw new Error(`Error generando embedding: ${error.message}`);
  }
}

/**
 * Calcula similitud coseno entre dos vectores
 * @param {number[]} vec1 - Vector 1
 * @param {number[]} vec2 - Vector 2
 * @returns {number} Similitud (0-1)
 */
function calcularSimilitud(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error("Los vectores deben tener la misma longitud");
  }

  let dotProduct = 0;
  let magnitud1 = 0;
  let magnitud2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitud1 += vec1[i] * vec1[i];
    magnitud2 += vec2[i] * vec2[i];
  }

  magnitud1 = Math.sqrt(magnitud1);
  magnitud2 = Math.sqrt(magnitud2);

  if (magnitud1 === 0 || magnitud2 === 0) {
    return 0;
  }

  return dotProduct / (magnitud1 * magnitud2);
}

/**
 * Busca documentos similares en MongoDB
 * @param {Object} VectorDocument - Modelo de Mongoose
 * @param {number[]} vectorBusqueda - Vector de búsqueda
 * @param {string} tenantId - ID del tenant
 * @param {number} limite - Número máximo de resultados
 * @returns {Promise<Object[]>} Documentos similares
 */
async function buscarDocumentosSimilares(
  VectorDocument,
  vectorBusqueda,
  tenantId,
  limite = 5,
) {
  try {
    // Obtener todos los documentos del tenant
    const documentos = await VectorDocument.find({
      tenant: tenantId,
    }).lean();

    // Calcular similitud con cada documento
    const resultados = documentos
      .map((doc) => ({
        ...doc,
        similitud: calcularSimilitud(vectorBusqueda, doc.vector),
      }))
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, limite)
      .filter((doc) => doc.similitud > 0.3); // Filtrar por similitud mínima

    return resultados;
  } catch (error) {
    throw new Error(`Error buscando documentos: ${error.message}`);
  }
}

module.exports = {
  parsePDF,
  dividirEnChunks,
  generarEmbedding,
  calcularSimilitud,
  buscarDocumentosSimilares,
  EMBEDDING_MODEL,
};
