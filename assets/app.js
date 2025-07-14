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

const loadingMessage = document.getElementById("loading-message");

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
  loadingMessage.style.display = "none";
});

const notesList = document.getElementById("notes-list");
const newNoteBtn = document.getElementById("new-note");

newNoteBtn.addEventListener("click", async () => {
  const notesCol = collection(db, "users", user.uid, "notes");
  const docRef = await addDoc(notesCol, {
  titulo: `Nota ${Math.random().toString(36).substring(2, 7)}`,
  texto: "",
  publica: true,
  userId: user.uid,
  ordem: Date.now() // campo de ordem
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

  // Cria array e ordena
  const notesArray = [];
  snapshot.forEach(docSnap => {
    const note = docSnap.data();
    notesArray.push({
      id: docSnap.id,
      titulo: note.titulo || `Nota ${docSnap.id.substring(0, 5)}`,
      ordem: note.ordem || 0
    });
  });

  notesArray.sort((a, b) => a.ordem - b.ordem);

  notesList.innerHTML = "";
  notesArray.forEach(note => {
    const div = document.createElement("div");
    div.id = `note-item-${note.id}`;
    div.dataset.id = note.id; // Necessário para sortable
    div.textContent = note.titulo;
    div.onclick = () => openNote(note.id);
    notesList.appendChild(div);
    notesList.style.display = "flex";
  });

  // Inicializa SortableJS
  Sortable.create(notesList, {
    animation: 150,
    onEnd: saveNewOrder
  });
}

async function saveNewOrder() {
  const items = document.querySelectorAll("#notes-list div");
  for (let i = 0; i < items.length; i++) {
    const noteId = items[i].dataset.id;
    const noteRef = doc(db, "users", user.uid, "notes", noteId);
    await updateDoc(noteRef, { ordem: i });
  }
}

async function openNote(id) {
  currentNoteId = id;
  const noteRef = doc(db, "users", user.uid, "notes", id);
  const noteDoc = await getDoc(noteRef);
  const note = noteDoc.data();

  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "flex";
  document.getElementById("note-title").value = note.titulo || "";
  document.getElementById("note-content").value = note.texto;
  document.getElementById("public-toggle").checked = note.publica;

  const shareLink = `${window.location.origin}/p.html?id=${id}`;
  const shareLinkDiv = document.getElementById("link-container");
  let link = document.getElementById("share-link");
  link.innerHTML = `<a href="${shareLink}" target="_blank">${shareLink}</a>`;

  // ✅ Mostra ou esconde o link com base no toggle
  if (note.publica) {
    shareLinkDiv.style.display = "flex";
  } else {
    shareLinkDiv.style.display = "none";
  }

  // Marca selected na sidebar
  document.querySelectorAll("#notes-list div").forEach(div => div.classList.remove("selected"));
  const selectedItem = document.getElementById(`note-item-${id}`);
  if (selectedItem) {
    selectedItem.classList.add("selected");
  }
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

  const shareLinkDiv = document.getElementById("link-container");
  const isTogglingToPrivate = !e.target.checked; // true se está tentando deixar privado

  // 🔧 CORREÇÃO: Se usuário FREE tenta deixar PRIVADO
  if (!isPro && isTogglingToPrivate) {
    showToast("Assine o plano Pro para deixar o texto privado", "verde");
    e.target.checked = true; // Força toggle voltar para ON
    shareLinkDiv.style.display = "flex";
    return;
  }

  // ✅ Usuário PRO ou está deixando público - pode prosseguir
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { publica: e.target.checked });

  if (e.target.checked) {
    shareLinkDiv.style.display = "flex";
    ("Texto compartilhado publicamente");
  } else {
    shareLinkDiv.style.display = "none";
    ("Texto privado");
  }
});

document.getElementById("delete-note").addEventListener("click", async () => {
  if (!currentNoteId) return;
  if (confirm("Deseja excluir esta nota?")) {
    const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
    await deleteDoc(noteRef);
    showToast("Texto excluído");
    document.getElementById("editor").style.display = "none";
    document.getElementById("home").style.display = "flex";
    loadNotes();
  }
});

const logo = document.getElementById("logo");
logo.addEventListener("click", () => {
  editor.style.display = "none";
  home.style.display = "flex";
  // ✅ Remove 'selected' de todas as notas
  document.querySelectorAll("#notes-list div").forEach(div => div.classList.remove("selected"));
});

/*
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}
*/

function showToast(msg, fundo = 'preto') {
    const cores = {
        vermelho: '#FF4949',
        verde: '#13CE66',
        preto: '#01131c'
    };
    
    let divToast = document.createElement('div');
    divToast.innerHTML = `<div id="toast" style="background-color: ${cores[fundo]}">${msg}</div>`;
    document.getElementsByTagName('body')[0].appendChild(divToast);
    
    var notifica = document.getElementById("toast");
    notifica.className = "show"; 
    
    setTimeout(function() {
        notifica.className = "show hide";
        setTimeout(function() {
            document.getElementsByTagName('body')[0].removeChild(divToast);
        }, 600);
    }, 3800);
}

document.getElementById("copy").addEventListener("click", () => {
  const shareLink = document.getElementById("share-link").textContent;
  navigator.clipboard.writeText(shareLink).then(() => {
    showToast("Link copiado!", 'vermelho');
  })
});
