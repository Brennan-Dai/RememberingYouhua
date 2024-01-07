import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref as sRef, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc } 
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
getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

let currentPhotoIndex = -1;
let photoURLs = [];
let photoIds = [];

auth.onAuthStateChanged(user => {
    document.getElementById('login-container').style.display = user ? 'none' : 'block';
    document.getElementById('upload-container').style.display = user ? 'block' : 'none';
    document.getElementById('comment-input').style.display = user ? 'block' : 'none';
    document.getElementById('post-comment').style.display = user ? 'block' : 'none';
});

document.getElementById('login').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(console.error);
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
    const photosContainer = document.getElementById('photos-container');
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
    document.getElementById('enlarged-photo').src = url;
    document.getElementById('photo-modal').style.display = 'block';
    loadComments(photoIds[currentPhotoIndex]);
}

document.getElementById('prev-photo').addEventListener('click', () => navigatePhoto(-1));
document.getElementById('next-photo').addEventListener('click', () => navigatePhoto(1));

function navigatePhoto(step) {
    currentPhotoIndex = (currentPhotoIndex + step + photoURLs.length) % photoURLs.length;
    document.getElementById('enlarged-photo').src = photoURLs[currentPhotoIndex];
    loadComments(photoIds[currentPhotoIndex]);
}

async function postComment(photoId, commentText) {
    if (!auth.currentUser) {
        alert('You must be logged in to post comments.');
        return;
    }

    const commentData = {
        text: commentText,
        timestamp: serverTimestamp(),
        userName: auth.currentUser.displayName,
        userId: auth.currentUser.uid
    };
    
    try {
        await addDoc(collection(db, "photos", photoId, "comments"), commentData);
        loadComments(photoId); // Call loadComments to update the UI
    } catch (error) {
        console.error("Error posting comment: ", error);
    }
}

async function loadComments(photoId) {
    const commentsContainer = document.getElementById('photo-comments');
    commentsContainer.innerHTML = ''; // Clear the comments container

    const q = query(collection(db, "photos", photoId, "comments"), orderBy("timestamp", "desc"));

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const commentData = doc.data();
            const commentBox = document.createElement("div");
            commentBox.className = 'comment-box';
            commentBox.textContent = `${commentData.userName}: ${commentData.text}`;
            commentsContainer.appendChild(commentBox);
        });
    } catch (error) {
        console.error("Error loading comments: ", error);
    }
}

document.getElementById('post-comment').addEventListener('click', async () => {
    const commentText = document.getElementById('comment-input').value.trim();
    if (commentText && currentPhotoIndex !== -1) {
        await postComment(photoIds[currentPhotoIndex], commentText);
        document.getElementById('comment-input').value = ''; // Clear the input field
    }
});

displayPhotos();