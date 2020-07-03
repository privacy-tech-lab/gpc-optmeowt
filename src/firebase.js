/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
firebase.js
================================================================================
firebase.js handles OptMeowt's connections to the firebase backend for 
database syncing and authentication
*/


// NOTE: Imports like these did not work for me since I used
//       `firebase.js` as a background script.
// import "https://www.gstatic.com/firebasejs/7.15.5/firebase-app.js";
// import "https://www.gstatic.com/firebase/7.15.5/firebase-auth.js";
// import "https://www.gstatic.com/firebase/7.15.5/firebase-firestore.js";

var firebaseConfig = {
    /* INSERT YOUR FIREBASECONFIG INFO HERE */
};
firebase.initializeApp(firebaseConfig);

console.log("initialized firebase...")
console.log(firebase)

/// Firestore function from the Google Firebase instruction page
/// https://firebase.google.com/docs/firestore/manage-data/add-data 
var db = firebase.firestore();
db.collection("cities").doc("LA").set({
    name: "Los Angeles", 
    state: "CA", 
    country: "USA"
})
.then(function () {
    console.log("Document written successfully!")
})
.catch(function(error) {
    console.error("Error writing docs: ", error)
})

/* 
            ---- You can delete this function as you see fit ---- 
    This is not fully implemented yet, it was an attempt to pull the stored 
    Firebase data everytime some webpage is refreshed by sending a runtime 
    message from `contentScript.js` that would get read by `firebase.js`, 
    intializing the data request. 
*/
// chrome.runtime.onMessage.addEventListener((msg, sender, response) => {
//     if (msg.command === "fetch") {
//         var docRef = db.collections("cities").doc("LA");
//         docRef.get().then(function(doc) {
//             if (doc.exists) {
//                 // console.log("Doc data: ", doc.data())
//                 response({type: "result", status: "success", data: doc.data(),
//                     request: msg})
//             } else {
//                 response({type: "result", status: "error", data: "No such doc!",
//                     request: msg})
//             }
//         }).catch(function(error) {
//             response({type: "result", status: "error", data: error,
//                     request: msg})
//         })
//     }
//     if (msg.command === "post") {
//     }
// })