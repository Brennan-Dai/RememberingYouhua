// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOuJVmdm8_c-tsCOM_wj2qesevVmESmWo",
    authDomain: "rememberingyouhua.firebaseapp.com",
    projectId: "rememberingyouhua",
    storageBucket: "rememberingyouhua.appspot.com",
    messagingSenderId: "716740076335",
    appId: "1:716740076335:web:bdf9edcb15068f04ff37da",
    measurementId: "G-VGS57JCJRT"
};

// Previous import statements...

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Handle Authentication State Changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, hide login button and show upload section
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('upload-container').style.display = 'block';
    } else {
        // No user is signed in, show login button
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('upload-container').style.display = 'none';
    }
});

// Existing Google Sign-In Logic...
// Existing Image Upload Logic...
// Existing Function to Display Photos...


// Google Sign-In Logic
document.getElementById('login').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            // Sign-in successful.
            // You can also get the user info from result.user
            console.log('User signed in');
            document.getElementById('upload-container').style.display = 'block'; // Show upload section
        })
        .catch((error) => {
            // Handle errors here.
            console.error(error);
        });
});

// Image Upload Logic
document.getElementById('uploadButton').addEventListener('click', () => {
    const imageInput = document.getElementById('imageInput');
    if (imageInput.files.length > 0) {
        const imageFile = imageInput.files[0];
        uploadImage(imageFile);
    }
});

function uploadImage(file) {
    const storageRef = sRef(storage, `images/${file.name}`);
    uploadBytes(storageRef, file).then((snapshot) => {
        console.log('Uploaded a file!');
        displayPhotos(); // Refresh the images displayed
    });
}

// Function to Display Photos
function displayPhotos() {
    const photosContainer = document.getElementById('photos-container');
    photosContainer.innerHTML = ''; // Clear existing images

    const listRef = sRef(storage, 'images/');
    listAll(listRef)
        .then((res) => {
            res.items.forEach((itemRef) => {
                getDownloadURL(itemRef).then((url) => {
                    const img = document.createElement('img');
                    img.src = url;
                    photosContainer.appendChild(img);
                });
            });
        })
        .catch((error) => {
            console.log("Error in fetching images:", error);
        });
}

// Initial call to display photos
displayPhotos();
