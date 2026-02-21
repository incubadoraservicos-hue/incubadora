importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDbwxJPqRz_ochrLTrlBwSz0H1iTQtfpSM",
    authDomain: "incubadora-notificacoes.firebaseapp.com",
    projectId: "incubadora-notificacoes",
    storageBucket: "incubadora-notificacoes.firebasestorage.app",
    messagingSenderId: "746049894266",
    appId: "1:746049894266:web:30e79c71fd0965f8f908c3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
