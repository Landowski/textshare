import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, setDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let isPro = false;
let currentNoteId = null;

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = "login.html";
    return;
  }
  user = u;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  isPro = userDoc.data().assinante;

  loadNotes();
});

const notesList = document.getElementById("notes-list");
const newNoteBtn = document.getElementById("new-note");

newNoteBtn.addEventListener("click", async () => {
  const notesCol = collection(db, "users", user.uid, "notes");
  const docRef = await addDoc(notesCol, {
    titulo: `Nota ${Math.random().toString(36).substring(2, 7)}`,
    texto: "",
    publica: !isPro,
    userId: user.uid
  });

  // 👇 Cria também o index auxiliar
  const notesIndexRef = doc(db, "notesIndex", docRef.id);
  await setDoc(notesIndexRef, {
    userId: user.uid
  });
  loadNotes();
  openNote(docRef.id);
});

async function loadNotes() {
  const notesCol = collection(db, "users", user.uid, "notes");
  const snapshot = await getDocs(notesCol);
  notesList.innerHTML = "";
  snapshot.forEach(docSnap => {
  const note = docSnap.data();
  const div = document.createElement("div");
  div.id = `note-item-${docSnap.id}`; // Para atualizar depois
  div.textContent = note.titulo || `Nota ${docSnap.id.substring(0, 5)}`;
  div.onclick = () => openNote(docSnap.id);
  notesList.appendChild(div);
});
}

async function openNote(id) {
  currentNoteId = id;
  const noteRef = doc(db, "users", user.uid, "notes", id);
  const noteDoc = await getDoc(noteRef);
  const note = noteDoc.data();

  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "block";
  document.getElementById("note-title").value = note.titulo || "";
  document.getElementById("note-content").value = note.texto;
  document.getElementById("public-toggle").checked = note.publica;
  document.getElementById("public-toggle").disabled = !isPro;

  const shareLink = `${window.location.origin}/pagina.html?uid=${user.uid}&nid=${id}`;
  document.getElementById("share-link").innerHTML = `<a href="${shareLink}" target="_blank">${shareLink}</a>`;
}

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

document.getElementById("note-content").addEventListener("input", debounce(async (e) => {
  if (!currentNoteId) return;
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { texto: e.target.value });
}, 500));

document.getElementById("note-title").addEventListener("input", debounce(async (e) => {
  if (!currentNoteId) return;
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { titulo: e.target.value });
  // Atualiza o título na sidebar em tempo real se quiser:
  updateSidebarTitle(currentNoteId, e.target.value);
}, 500));

function updateSidebarTitle(noteId, newTitle) {
  const item = document.getElementById(`note-item-${noteId}`);
  if (item) {
    item.textContent = newTitle || `Nota ${noteId.substring(0, 5)}`;
  }
}

document.getElementById("public-toggle").addEventListener("change", async (e) => {
  if (!currentNoteId) return;
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { publica: e.target.checked });
});

document.getElementById("delete-note").addEventListener("click", async () => {
  if (!currentNoteId) return;
  if (confirm("Deseja excluir esta nota?")) {
    const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
    await deleteDoc(noteRef);
    document.getElementById("editor").style.display = "none";
    document.getElementById("home").style.display = "block";
    loadNotes();
  }
});
