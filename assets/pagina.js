import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const urlParts = window.location.pathname.split("/");
const noteId = urlParts[urlParts.length - 1];

(async () => {
  const noteDoc = await getDoc(doc(db, "notes", noteId));
  if (!noteDoc.exists()) {
    document.body.innerHTML = "<p>Nota não encontrada.</p>";
    return;
  }

  const note = noteDoc.data();
  if (note.isPublic || note.plan === "free") {
    document.getElementById("note-title").textContent = note.title;
    document.getElementById("note-content").textContent = note.content;
  } else {
    document.body.innerHTML = "<p>Esta nota é privada.</p>";
  }
})();
