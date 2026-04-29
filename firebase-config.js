// firebase-config.jsx

const firebaseConfig = {
  apiKey: "AIzaSyCAv5etz_NLhLiXco0Jz46rs69wmEKoL8M",
  authDomain: "sistemacrm-31adc.firebaseapp.com",
  projectId: "sistemacrm-31adc",
  storageBucket: "sistemacrm-31adc.firebasestorage.app",
  messagingSenderId: "222258489816",
  appId: "1:222258489816:web:a077b9739a3e98950b6aad"
};

// Inicializar Firebase (modo compatible)
firebase.initializeApp(firebaseConfig);

// 🔥 LO QUE TU APP NECESITA
window.fbAuth = firebase.auth();
window.fbDb = firebase.firestore();
window.fbStorage = firebase.storage();
window.fbReady = true;

// Persistencia
window.fbDb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
window.fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});