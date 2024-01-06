// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOuJVmdm8_c-tsCOM_wj2qesevVmESmWo",
    authDomain: "rememberingyouhua.firebaseapp.com",
    projectId: "rememberingyouhua",
    storageBucket: "rememberingyouhua.appspot.com",
    messagingSenderId: "716740076335",
    appId: "1:716740076335:web:bdf9edcb15068f04ff37da",
    measurementId: "G-VGS57JCJRT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Global variable to track the current photo ID
let currentPhotoId = null;

// Handle Authentication State Changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('upload-container').style.display = 'block';
    } else {
        // No user is signed in
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('upload-container').style.display = 'none';
    }
});

// Google Sign-In Logic
document.getElementById('login').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log('User signed in');
        })
        .catch((error) => {
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
                    img.onclick = function() {
                        document.getElementById('enlarged-photo').src = url;
                        document.getElementById('photo-modal').style.display = 'block';
                        currentPhotoId = itemRef.name; // Set the current photo ID
                        loadComments(itemRef.name); // Load comments for the photo
                        document.getElementById('photo-comments').style.display = 'block';
                        document.getElementById('comment-input').style.display = 'block';
                        document.getElementById('post-comment').style.display = 'block';
                    };
                    photosContainer.appendChild(img);
                });
            });
        });
}

// Modal handling
var modal = document.getElementById('photo-modal');
var span = document.getElementsByClassName('close')[0];

span.onclick = function() {
    modal.style.display = 'none';
    document.getElementById('photo-comments').style.display = 'none';
    document.getElementById('comment-input').style.display = 'none';
    document.getElementById('post-comment').style.display = 'none';
};

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
        document.getElementById('photo-comments').style.display = 'none';
        document.getElementById('comment-input').style.display = 'none';
        document.getElementById('post-comment').style.display = 'none';
    }
};

// Function to post a comment
async function postComment(photoId, commentText) {
    const commentData = {
        text: commentText,
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid
    };
    await addDoc(collection(db, "photos", photoId, "comments"), commentData);
}

// Function to load comments for a photo
async function loadComments(photoId) {
    const commentsContainer = document.getElementById('photo-comments');
    commentsContainer.innerHTML = ''; // Clear existing comments

    const q = query(collection(db, "photos", photoId, "comments"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        const commentElement = document.createElement("div");
        commentElement.textContent = commentData.text; // Format as needed
        commentsContainer.appendChild(commentElement);
    });
}

// Event listener for posting a comment
document.getElementById('post-comment').addEventListener('click', async () => {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value;
    if (currentPhotoId && commentText) {
        await postComment(currentPhotoId, commentText);
        commentInput.value = ''; // Clear the input
        await loadComments(currentPhotoId); // Reload comments
    } else {
        console.log('No photo selected or comment text is empty');
    }
});

// Load initial photos
displayPhotos();
