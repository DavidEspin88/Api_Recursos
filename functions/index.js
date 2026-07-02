/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.procesarFinanzas = onRequest(async (req, res) => {
  // 1. Cargar las credenciales seguras de tu servidor
  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  const TOKEN_SECRETO = process.env.TOKEN_SECRETO;

  if (!APPS_SCRIPT_URL || !TOKEN_SECRETO) {
    logger.error("Error de configuración: Faltan variables en el archivo .env");
    return res.status(500).json({ 
      status: "error", 
      message: "Configuración del servidor incompleta." 
    });
  }

  try {
    let respuestaGAS;

    if (req.method === "GET") {
      // 2a. Petición de LECTURA: reenviar como GET, preservando los query params
      //     e inyectando el token también como parámetro de la URL.
      const paramsCliente = new URLSearchParams(req.query);
      paramsCliente.set("token", TOKEN_SECRETO);

      const urlConToken = `${APPS_SCRIPT_URL}?${paramsCliente.toString()}`;
      respuestaGAS = await fetch(urlConToken, { method: "GET" });

    } else {
      // 2b. Petición de ESCRITURA: reenviar como POST, inyectando el token en el body
      const datosCliente = req.body || {};
      const payloadSeguro = {
        ...datosCliente,
        token: TOKEN_SECRETO
      };

      respuestaGAS = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payloadSeguro)
      });
    }

    const resultadoJSON = await respuestaGAS.json();

    // 3. Responder de vuelta al cliente (App o Web)
    return res.status(200).json(resultadoJSON);

  } catch (error) {
    logger.error("Error al redireccionar la petición a Apps Script:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Error de comunicación con el backend de Google: " + error.toString() 
    });
  }
});

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });