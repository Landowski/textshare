import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");
const nid = params.get("nid");

const userRef = doc(db, "users", uid);
const noteRef = doc(db, "users", uid, "notes", nid);

const [userSnap, noteSnap] = await Promise.all([getDoc(userRef), getDoc(noteRef)]);

if (!userSnap.exists() || !noteSnap.exists()) {
  document.getElementById("content").innerHTML = "<p>Nota não encontrada.</p>";
} else {
  const user = userSnap.data();
  const note = noteSnap.data();

  if (note.publica || !user.assinante) {
    document.getElementById("note-title").textContent = note.titulo || "Sem título";
    document.getElementById("content").textContent = note.texto;
  } else {
    document.getElementById("content").innerHTML = "<p>Esta nota é privada.</p>";
  }
}
