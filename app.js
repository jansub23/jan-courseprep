const WEBHOOK_URL = "https://janani23.app.n8n.cloud/webhook-test/c6758e8a-62aa-44d0-a18c-95b1fd367836";

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadError = document.getElementById("upload-error");
const viewer = document.getElementById("viewer");
const pdfFrame = document.getElementById("pdf-frame");
const contractSub = document.getElementById("contract-sub");
const headerFile = document.getElementById("header-file");
const headerFileName = document.getElementById("header-file-name");
const replaceBtn = document.getElementById("replace-btn");
const clearBtn = document.getElementById("clear-btn");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const messages = document.getElementById("messages");

let objectUrl = null;
let currentFile = null;

function showError(msg) {
  uploadError.textContent = msg;
  uploadError.hidden = !msg;
}

function formatSize(bytes) {
  return bytes < 1048576
    ? Math.max(1, Math.round(bytes / 1024)) + " KB"
    : (bytes / 1048576).toFixed(1) + " MB";
}

function loadFile(file) {
  if (!file) return;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    showError("That file isn't a PDF. Please choose a .pdf contract.");
    return;
  }
  showError("");
  currentFile = file;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  pdfFrame.src = objectUrl;

  contractSub.textContent = file.name + " · " + formatSize(file.size);
  headerFileName.textContent = file.name;
  headerFile.hidden = false;
  dropZone.hidden = true;
  viewer.hidden = false;
  replaceBtn.hidden = false;
  clearBtn.hidden = false;
  addMessage("Loaded “" + file.name + "”. What would you like to know?", "bot");
}

function clearFile() {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  currentFile = null;
  pdfFrame.removeAttribute("src");
  fileInput.value = "";
  viewer.hidden = true;
  replaceBtn.hidden = true;
  clearBtn.hidden = true;
  headerFile.hidden = true;
  dropZone.hidden = false;
  contractSub.textContent = "No document uploaded";
  showError("");
}

fileInput.addEventListener("change", () => {
  loadFile(fileInput.files[0]);
  fileInput.value = ""; // allow re-selecting the same file
});
replaceBtn.addEventListener("click", () => fileInput.click());
clearBtn.addEventListener("click", clearFile);

["dragenter", "dragover"].forEach(evt =>
  dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add("dragover"); })
);
["dragleave", "drop"].forEach(evt =>
  dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove("dragover"); })
);
dropZone.addEventListener("drop", e => loadFile(e.dataTransfer.files[0]));

function addMessage(text, who, extraClass) {
  const div = document.createElement("div");
  div.className = "message " + who + (extraClass ? " " + extraClass : "");
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "message bot typing";
  div.setAttribute("aria-label", "Assistant is typing");
  div.innerHTML = "<span></span><span></span><span></span>";
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function parseReply(data) {
  if (typeof data === "string") data = JSON.parse(data);
  if (Array.isArray(data)) data = data[0];
  if (data && typeof data.output === "string") data = JSON.parse(data.output);
  if (!data || typeof data.response !== "string") throw new Error("Unexpected response format");
  return {
    response: data.response,
    citation: Array.isArray(data.citation) ? data.citation.map(String) : [],
    reasoning: typeof data.reasoning === "string" ? data.reasoning : ""
  };
}

function addAnswer(reply) {
  const div = document.createElement("div");
  div.className = "message bot reply";

  const answer = document.createElement("p");
  answer.className = "answer";
  answer.textContent = reply.response;
  div.appendChild(answer);

  if (reply.citation.length) {
    const h = document.createElement("p");
    h.className = "section-label";
    h.textContent = "Citations";
    const ul = document.createElement("ul");
    ul.className = "citations";
    reply.citation.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      ul.appendChild(li);
    });
    div.append(h, ul);
  }

  if (reply.reasoning) {
    const h = document.createElement("p");
    h.className = "section-label";
    h.textContent = "Reasoning";
    const r = document.createElement("p");
    r.className = "reasoning";
    r.textContent = reply.reasoning;
    div.append(h, r);
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

const sendBtn = form.querySelector("button[type=submit]");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  if (!currentFile) {
    addMessage("Please upload a contract PDF first, then ask your question.", "bot");
    return;
  }

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;
  const typing = showTyping();

  try {
    const body = new FormData();
    body.append("file", currentFile, currentFile.name);
    body.append("message", text);

    const res = await fetch(WEBHOOK_URL, { method: "POST", body });
    if (!res.ok) throw new Error("Webhook returned " + res.status);
    const raw = await res.text();
    typing.remove();
    addAnswer(parseReply(raw));
  } catch (err) {
    typing.remove();
    console.error(err);
    addMessage("Sorry, something went wrong getting an answer. Please try again.", "bot", "error-msg");
  } finally {
    sendBtn.disabled = false;
  }
});
