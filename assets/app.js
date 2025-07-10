import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let plan = "free";
let currentNoteId = null;

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = "login.html";
    return;
  }
  user = u;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  plan = userDoc.data().plan || "free";

  loadNotes();
});

document.getElementById("new-note").addEventListener("click", async () => {
  const note = await addDoc(collection(db, "notes"), {
    uid: user.uid,
    title: "Nova Nota",
    content: "",
    isPublic: plan === "free" ? true : false
  });
  loadNotes();
  openNote(note.id);
});

async function loadNotes() {
  const q = query(collection(db, "notes"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const div = document.createElement("div");
    div.textContent = docSnap.data().title;
    div.onclick = () => openNote(docSnap.id);
    notesList.appendChild(div);
  });
}

async function openNote(id) {
  currentNoteId = id;
  const noteDoc = await getDoc(doc(db, "notes", id));
  const note = noteDoc.data();

  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "block";
  document.getElementById("note-title").value = note.title;
  document.getElementById("note-content").value = note.content;
  document.getElementById("public-toggle").checked = note.isPublic;

  document.getElementById("public-toggle").disabled = plan === "free";
}

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

document.getElementById("note-title").addEventListener("input", debounce(async (e) => {
  if (!currentNoteId) return;
  await updateDoc(doc(db, "notes", currentNoteId), { title: e.target.value });
  loadNotes();
}, 500));

document.getElementById("note-content").addEventListener("input", debounce(async (e) => {
  if (!currentNoteId) return;
  await updateDoc(doc(db, "notes", currentNoteId), { content: e.target.value });
}, 500));

document.getElementById("public-toggle").addEventListener("change", async (e) => {
  if (!currentNoteId) return;
  await updateDoc(doc(db, "notes", currentNoteId), { isPublic: e.target.checked });
});

document.getElementById("delete-note").addEventListener("click", async () => {
  if (confirm("Deseja mesmo excluir esta nota?")) {
    await deleteDoc(doc(db, "notes", currentNoteId));
    document.getElementById("editor").style.display = "none";
    document.getElementById("home").style.display = "block";
    loadNotes();
  }
});
