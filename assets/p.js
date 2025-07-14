import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 👉 CONFIG FIREBASE
// 🔥 CONFIGURE SEUS DADOS!
const firebaseConfig = {
  apiKey: "AIzaSyBegicDngP4KCpz-JWMDM1uGd-wsHBxoBs",
  authDomain: "textshare-92fca.firebaseapp.com",
  projectId: "textshare-92fca",
  storageBucket: "textshare-92fca.firebasestorage.app",
  messagingSenderId: "800854294565",
  appId: "1:800854294565:web:bcda3e1627ef27e5f1bfcc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 👉 Pega o {noteId} da URL no formato /p/{noteId}
const params = new URLSearchParams(window.location.search);
const noteId = params.get('id');

if (!noteId) {
  document.body.innerHTML = "<p>ID da nota não encontrado na URL.</p>";
  throw new Error("ID inválido");
}

async function loadNote() {
  try {
    // 1️⃣ Pega o userId no índice
    const indexRef = doc(db, "notesIndex", noteId);
    const indexSnap = await getDoc(indexRef);

    if (!indexSnap.exists()) {
      document.body.innerHTML = "<p>Nota não encontrada.</p>";
      return;
    }

    const userId = indexSnap.data().userId;

    // 2️⃣ Busca a nota na subcoleção correta
    const noteRef = doc(db, "users", userId, "notes", noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) {
      document.body.innerHTML = "<p>Nota não encontrada.</p>";
      return;
    }

    const note = noteSnap.data();

    // 3️⃣ Verifica se é pública
    if (!note.publica) {
      document.body.innerHTML = "<p>Esta nota é privada.</p>";
      return;
    }

    // 4️⃣ Mostra título + conteúdo
    document.title = note.titulo + " - Textshare" || "Sem título - Textshare";
    document.getElementById("note-title").textContent = note.titulo || "Sem título";
    document.getElementById("content").textContent = note.texto || "";

  } catch (error) {
    document.body.innerHTML = "<p>Esta nota é privada.</p>";
  }
}

loadNote();
