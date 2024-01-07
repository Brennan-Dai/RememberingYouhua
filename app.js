import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCOuJVmdm8_c-tsCOM_wj2qesevVmESmWo",
    authDomain: "rememberingyouhua.firebaseapp.com",
    projectId: "rememberingyouhua",
    storageBucket: "rememberingyouhua.appspot.com",
    messagingSenderId: "716740076335",
    appId: "1:716740076335:web:bdf9edcb15068f04ff37da",
    measurementId: "G-VGS57JCJRT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

let currentPhotoIndex = -1;
let photoURLs = [];
let photoIds = [];

const loginContainer = document.getElementById('login-container');
const uploadContainer = document.getElementById('upload-container');
const photosContainer = document.getElementById('photos-container');
const commentInput = document.getElementById('comment-input');
const postCommentBtn = document.getElementById('post-comment');
const modal = document.getElementById('photo-modal');
const enlargedPhoto = document.getElementById('enlarged-photo');
const photoComments = document.getElementById('photo-comments');

auth.onAuthStateChanged(user => {
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

document.getElementById('login').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
        console.error(error);
    });
});

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
        displayPhotos();
    });
}

function displayPhotos() {
    photosContainer.innerHTML = '';
    photoURLs = [];
    photoIds = [];

    const listRef = sRef(storage, 'images/');
    listAll(listRef).then((res) => {
        res.items.forEach((itemRef) => {
            getDownloadURL(itemRef).then((url) => {
                photoURLs.push(url);
                photoIds.push(itemRef.name);
                const img = document.createElement('img');
                img.src = url;
                img.onclick = () => openModal(url, photoIds.indexOf(itemRef.name));
                photosContainer.appendChild(img);
            });
        });
    });
}

function openModal(url, index) {
    currentPhotoIndex = index;
    enlargedPhoto.src = url;
    modal.style.display = 'block';
    loadComments(photoIds[currentPhotoIndex]);
}

document.getElementById('prev-photo').addEventListener('click', () => navigatePhoto(-1));
document.getElementById('next-photo').addEventListener('click', () => navigatePhoto(1));

function navigatePhoto(step) {
    currentPhotoIndex = (currentPhotoIndex + step + photoURLs.length) % photoURLs.length;
    enlargedPhoto.src = photoURLs[currentPhotoIndex];
    loadComments(photoIds[currentPhotoIndex]);
}

async function postComment(photoId, commentText) {
    const commentData = {
        text: commentText,
        timestamp: serverTimestamp(),
        userName: auth.currentUser.displayName,
        userId: auth.currentUser.uid
    };
    await addDoc(collection(db, "photos", photoId, "comments"), commentData);
}

async function loadComments(photoId) {
    photoComments.innerHTML = '';

    const q = query(collection(db, "photos", photoId, "comments"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        const commentBox = document.createElement("div");
        commentBox.className = 'comment-box';
        commentBox.textContent = `${commentData.userName}: ${commentData.text}`;
        photoComments.appendChild(commentBox);
    });
}

document.getElementById('post-comment').addEventListener('click', async () => {
    const commentText = commentInput.value;
    if (commentText) {
        await postComment(photoIds[currentPhotoIndex], commentText);
        commentInput.value = '';
        loadComments(photoIds[currentPhotoIndex]);
    }
});

displayPhotos();
