import firebase from "firebase";

var config = { /* COPY THE ACTUAL CONFIG FROM FIREBASE CONSOLE */
  apiKey: "AIzaSyBYODCCyoF-jJFYKhb8zdb2qYcwbp6w0Ns",
  authDomain: "rockygorgetournaments.firebaseapp.com",
  databaseURL: "https://rockygorgetournaments.firebaseio.com",
  projectId: "rockygorgetournaments",
  storageBucket: "rockygorgetournaments.appspot.com",
  messagingSenderId: "802837198898"
};
var fire = firebase.initializeApp(config);
export default fire;