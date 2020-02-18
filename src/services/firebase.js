/*
Initialize Firebase and Firestore
*/

import * as firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyA34QvfP0Zgjk4m6u8fnT3kqG3W3xNWCnU",
    authDomain: "privacy-rights-platform.firebaseapp.com",
    databaseURL: "https://privacy-rights-platform.firebaseio.com",
    projectId: "privacy-rights-platform",
    storageBucket: "privacy-rights-platform.appspot.com",
    messagingSenderId: "1086913812923",
    appId: "1:1086913812923:web:eef510bee3a48ae0248c9e"
}

firebase.initializeApp(firebaseConfig)

export const db = firebase.firestore() 