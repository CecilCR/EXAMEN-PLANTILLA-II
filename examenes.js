/* =====================================================
   PÁGINA ÍNDICE DE EXÁMENES
   examenes.js
   - Lee examenes.json (lista simple de nombres de archivo).
   - Por cada archivo, carga su configuración (título, curso,
     tiempo, N° de preguntas) y arma una tarjeta con enlace
     directo a examen.html?banco=<archivo>.
   - Si el docente agrega o quita exámenes, solo debe editar
     examenes.json — no hace falta tocar este script.
===================================================== */

function escapeHTML(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function sinCache(url) {
  return url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();
}

async function cargarListaExamenes() {
  const contenedor = document.getElementById("listaExamenes");

  let listaArchivos;
  try {
    const resp = await fetch(sinCache("examenes.json"), { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    listaArchivos = await resp.json();
    if (!Array.isArray(listaArchivos) || listaArchivos.length === 0) {
      throw new Error("El archivo examenes.json está vacío o no es una lista válida.");
    }
  } catch (err) {
    contenedor.innerHTML = `
      <h2>No se pudo cargar la lista de exámenes</h2>
      <p>No se encontró o no se pudo leer <strong>examenes.json</strong>.</p>
      <p style="color:#777;font-size:14px;margin-top:10px">Detalle técnico: ${escapeHTML(err.message)}</p>
      <hr style="margin:20px 0">
      <p style="font-size:14px;color:#555">
        Si eres el/la docente: crea un archivo <strong>examenes.json</strong> en la raíz del repositorio
        con una lista de los nombres de archivo de tus bancos de preguntas, por ejemplo:
      </p>
      <pre style="background:#f5f7fa;padding:15px;border-radius:8px;overflow:auto;margin-top:10px">["parcial1.json", "motivacion_seccion_A.json"]</pre>
    `;
    return;
  }

  const resultados = await Promise.allSettled(
    listaArchivos.map((archivo) => fetch(sinCache(archivo), { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }))
  );

  let html = "";
  let algunoCargo = false;

  resultados.forEach((resultado, i) => {
    const archivo = listaArchivos[i];

    if (resultado.status === "rejected") {
      html += `
        <div class="tarjeta" style="border-left-color:var(--rojo)">
          <h3 style="color:var(--rojo)">⚠️ ${escapeHTML(archivo)}</h3>
          <p>No se pudo cargar este examen (verifica que el archivo exista en el repositorio).</p>
        </div>
      `;
      return;
    }

    algunoCargo = true;
    const datos = resultado.value;
    const config = Object.assign(
      { titulo: archivo, curso: "", tiempo: "?" },
      datos.configuracion || {}
    );
    const numPreguntas = Array.isArray(datos.preguntas) ? datos.preguntas.length : "?";

    html += `
      <div class="tarjeta">
        <h3>${escapeHTML(config.titulo)}</h3>
        <p>${escapeHTML(config.curso)}</p>
        <p><strong>Preguntas:</strong> ${numPreguntas} &nbsp;|&nbsp; <strong>Tiempo:</strong> ${escapeHTML(String(config.tiempo))} min</p>
        <a href="examen.html?banco=${encodeURIComponent(archivo)}">
          <button class="verde">▶ Ir al examen</button>
        </a>
      </div>
    `;
  });

  if (!algunoCargo) {
    html += `<p style="margin-top:20px;color:#777">Ninguno de los exámenes listados en examenes.json pudo cargarse.</p>`;
  }

  contenedor.innerHTML = `<div id="listaPreguntas">${html}</div>`;
}

window.onload = cargarListaExamenes;
