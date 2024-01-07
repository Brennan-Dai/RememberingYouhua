// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc } 
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

// Global variables
let currentPhotoId = null;
let photoUrls = [];

// Handle Authentication State Changes
auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const uploadContainer = document.getElementById('upload-container');
    const commentInput = document.getElementById('comment-input');
    const postCommentBtn = document.getElementById('post-comment');

    if (user) {
        loginContainer.style.display = 'none';
        uploadContainer.style.display = 'block';
        commentInput.style.display = 'block';
        postCommentBtn.style.display = 'block';
    } else {
        loginContainer.style.display = 'block';
        uploadContainer.style.display = 'none';
        commentInput.style.display = 'none';
        postCommentBtn.style.display = 'none';
    }
});

// Google Sign-In Logic
document.getElementById('login').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
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
    uploadBytes(storageRef, file).then(() => {
        displayPhotos(); // Refresh the images displayed
    });
}

// Function to Display Photos
function displayPhotos() {
    const photosContainer = document.getElementById('photos-container');
    photosContainer.innerHTML = ''; // Clear existing images
    photoUrls = []; // Reset the photoUrls array

    const listRef = sRef(storage, 'images/');
    listAll(listRef)
        .then((res) => {
            res.items.forEach((itemRef, index) => {
                getDownloadURL(itemRef).then((url) => {
                    photoUrls.push(url); // Store the URL for navigation
                    const img = document.createElement('img');
                    img.src = url;
                    img.onclick = () => openModal(url, index);
                    photosContainer.appendChild(img);
                });
            });
        });
}

function openModal(url, index) {
    currentPhotoId = index; // Set the current photo index for navigation
    const modal = document.getElementById('photo-modal');
    const enlargedPhoto = document.getElementById('enlarged-photo');
    enlargedPhoto.src = url;
    modal.style.display = 'block';
    loadComments(index); // Load comments for the photo
}

// Modal handling
var modal = document.getElementById('photo-modal');
var span = document.getElementsByClassName('close')[0];

span.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Next and Previous Photo Navigation
document.getElementById('prev-photo').addEventListener('click', () => navigatePhoto(-1));
document.getElementById('next-photo').addEventListener('click', () => navigatePhoto(1));

function navigatePhoto(direction) {
    currentPhotoId = (currentPhotoId + direction + photoUrls.length) % photoUrls.length;
    const enlargedPhoto = document.getElementById('enlarged-photo');
    enlargedPhoto.src = photoUrls[currentPhotoId];
    loadComments(currentPhotoId); // Load comments for the new photo
}

// Function to post a comment
async function postComment(photoId, commentText) {
    const commentData = {
        text: commentText,
        timestamp: serverTimestamp(),
        userName: auth.currentUser ? auth.currentUser.displayName : "Anonymous",
        userId: auth.currentUser ? auth.currentUser.uid : null
    };
    await addDoc(collection(db, "photos", photoId.toString(), "comments"), commentData);
}

// Function to load comments for a photo
async function loadComments(photoId) {
    const commentsContainer = document.getElementById('photo-comments');
    commentsContainer.innerHTML = ''; // Clear existing comments

    const q = query(collection(db, "photos", photoId.toString(), "comments"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        const commentElement = document.createElement("div");
        commentElement.className = 'comment-box';
        commentElement.textContent = `${commentData.userName}: ${commentData.text}`;
        commentsContainer.appendChild(commentElement);
    });
}

// Event listener for posting a comment
document.getElementById('post-comment').addEventListener('click', async () => {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value;
    if (currentPhotoId !== null && commentText) {
        await postComment(currentPhotoId, commentText);
        commentInput.value = ''; // Clear the input
        loadComments(currentPhotoId); // Reload comments
    } else {
        console.log('No photo selected or comment text is empty');
    }
});

// Load initial photos
displayPhotos();
