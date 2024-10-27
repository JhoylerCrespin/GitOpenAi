async function fetchStreamedData(
  messages,
  temperature = 0.7,
  max_tokens = 150,
  top_p = 1.0,
  frequency_penalty = 0,
  presence_penalty = 0,
  stop = null,
  model = "gpt-4"
) {
  try {
    const response = await fetch(
      `https://openaiapptest.azurewebsites.net/api/FuncionAI?`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens,
          top_p: top_p,
          frequency_penalty: frequency_penalty,
          presence_penalty: presence_penalty,
          stop: stop,
          model: model,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en la respuesta HTTP:", errorText);
      document.getElementById("output").textContent =
        "Error en la solicitud: " + errorText;
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const outputElement = document.getElementById("output");
    outputElement.textContent = ""; // Limpia el contenido anterior

    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        outputElement.textContent += chunk;
      }
    }

    if (done) {
      console.log("Streaming finalizado.");
    }
  } catch (error) {
    console.error("Error al hacer la solicitud:", error);
    document.getElementById("output").textContent =
      "Error en la solicitud: " + error.message;
  }
}

// Función para manejar el envío de la pregunta
function handleSubmit() {
  const questionInput = document.getElementById("question");
  const question = questionInput.value;

  if (question.trim() === "") {
    alert("Por favor, escribe una pregunta.");
    return;
  }

  // Formato del mensaje para la API (puede variar según cómo se estructure en tu API)
  const messages = [{ role: "user", content: question }];

  // Llama a la función para obtener la respuesta
  fetchStreamedData(messages);
}

async function fetchStreamedDataJson(
  messages,
  temperature = 0.7,
  max_tokens = 150,
  top_p = 1.0,
  frequency_penalty = 0,
  presence_penalty = 0,
  stop = null,
  model = "gpt-4"
) {
  try {
    const response = await fetch(
      `https://openaiapptest.azurewebsites.net/api/RespuestaJsonAi?`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens,
          top_p: top_p,
          frequency_penalty: frequency_penalty,
          presence_penalty: presence_penalty,
          stop: stop,
          model: model,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en la respuesta HTTP:", errorText);
      document.getElementById("output").textContent =
        "Error en la solicitud: " + errorText;
      return;
    }

    // Procesa la respuesta JSON
    const responseData = await response.json();

    // Muestra el contenido de la respuesta
    const assistantMessage = responseData.choices[0].message.content;
    document.getElementById("outputJson").textContent = assistantMessage;

    // Muestra información adicional
    document.getElementById("model").textContent = responseData.model;

    document.getElementById("promptTokens").textContent =
      responseData.usage.prompt_tokens;

    document.getElementById("completionTokens").textContent =
      responseData.usage.completion_tokens;

    document.getElementById("totalTokens").textContent =
      responseData.usage.total_tokens;
  } catch (error) {
    console.error("Error al hacer la solicitud:", error);
    document.getElementById("outputJson").textContent =
      "Error en la solicitud: " + error.message;
  }
}

// Función para manejar el envío de la pregunta
function handleSubmitJson() {
  const questionInput = document.getElementById("questionJson");
  const question = questionInput.value;

  if (question.trim() === "") {
    alert("Por favor, escribe una pregunta.");
    return;
  }

  // Formato del mensaje para la API
  const messages = [{ role: "user", content: question }];

  // Llama a la función para obtener la respuesta
  fetchStreamedDataJson(messages);
}

//-----------------------Analisis de Archivos------------------------//

async function handleSubmitAnalizeFile() {
  const questionInput = document.getElementById("promptAnalizarFile");
  const question = questionInput.value;

  if (question.trim() === "") {
    alert(
      "Por favor, escribe una pregunta para obtener una respuesta certera."
    );
    return;
  }

  // Contenido inicial con la pregunta
  let content = [{ type: "text", text: question }];

  // Obtener las URL base64 del archivo
  const listaUrlsB64 = await evaluateFile();

  if (!listaUrlsB64) {
    alert(
      "No se pudo procesar el archivo. Asegúrate de que sea una imagen o PDF."
    );
    return;
  }

  // Agregar cada URL base64 al contenido
  listaUrlsB64.forEach((url) => {
    content.push({ type: "image_url", image_url: { url: url } });
  });

  // Formato del mensaje para la API
  const messages = [{ role: "user", content: content }];

  // Llama a la función para obtener la respuesta
  console.log(messages);
  analyzeFile(messages);
}

// Convertir archivo a URLs Base64
async function evaluateFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor, selecciona un archivo.");
    return;
  }

  const fileType = file.type;
  let base64Urls = [];

  if (fileType === "application/pdf") {
    base64Urls = await processPdf(file);
  } else if (fileType.startsWith("image/")) {
    base64Urls = [await convertImageToBase64(file)];
  } else {
    document.getElementById("result").textContent =
      "El archivo no es una imagen ni un PDF.";
    return;
  }

  console.log(base64Urls); // Array con todas las imágenes en Base64
  return base64Urls;
}

// Convertir imagen a Base64
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Procesar PDF y convertir cada página a una imagen Base64
async function processPdf(file) {
  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const pageCount = pdf.numPages;
  const imagesBase64 = [];

  for (let i = 1; i <= pageCount; i++) {
    const imageBase64 = await renderPageToImage(pdf, i);
    imagesBase64.push(imageBase64);
  }

  return imagesBase64;
}

// Renderizar página del PDF en una imagen Base64
async function renderPageToImage(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const scale = 1.5;
  const viewport = page.getViewport({ scale: scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");

  await page.render({ canvasContext: context, viewport: viewport }).promise;
  return canvas.toDataURL("image/png");
}

// Función para llamar a la API
async function analyzeFile(
  messages,
  temperature = 0.7,
  max_tokens = 500,
  top_p = 1.0,
  frequency_penalty = 0,
  presence_penalty = 0,
  model = "gpt-4o-mini"
) {
  try {
    const response = await fetch(
      "https://openaiapptest.azurewebsites.net/api/ResumirPDFs?",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          temperature: temperature,
          max_tokens: max_tokens,
          top_p: top_p,
          frequency_penalty: frequency_penalty,
          presence_penalty: presence_penalty,
          model: model,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en la respuesta HTTP:", errorText);
      document.getElementById("outputAnalisisFile").textContent =
        "Error en la solicitud: " + errorText;
      return;
    }

    const responseData = await response.json();
    const assistantMessage = responseData.choices[0].message.content;
    document.getElementById("outputAnalisisFile").textContent =
      assistantMessage;

    document.getElementById("totalTokensFile").textContent =
      responseData.usage.completion_tokens;
  } catch (error) {
    console.error("Error al hacer la solicitud:", error);
    document.getElementById("outputAnalisisFile").textContent =
      "Error en la solicitud: " + error.message;
  }
}
