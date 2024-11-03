// Firebase configuration
const firebaseConfig = {
    // Your Firebase configuration object goes here
    // You can find this in your Firebase project settings
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const homeSection = document.getElementById('homeSection');
const profileSection = document.getElementById('profileSection');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const homeBtn = document.getElementById('homeBtn');
const profileBtn = document.getElementById('profileBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const postForm = document.getElementById('postForm');
const postsDiv = document.getElementById('posts');
const userInfoDiv = document.getElementById('userInfo');
const userPostsDiv = document.getElementById('userPosts');

// Event listeners for navigation
loginBtn.addEventListener('click', () => showSection(loginSection));
signupBtn.addEventListener('click', () => showSection(signupSection));
homeBtn.addEventListener('click', () => showSection(homeSection));
profileBtn.addEventListener('click', () => showSection(profileSection));
logoutBtn.addEventListener('click', logout);

// Event listeners for forms
loginForm.addEventListener('submit', login);
signupForm.addEventListener('submit', signup);
postForm.addEventListener('submit', createPost);

// Function to show a specific section and hide others
function showSection(section) {
    [loginSection, signupSection, homeSection, profileSection].forEach(s => s.style.display = 'none');
    section.style.display = 'block';
    if (section === homeSection) {
        loadPosts();
    } else if (section === profileSection) {
        loadUserInfo();
        loadUserPosts();
    }
}

// Function to handle user login
function login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showSection(homeSection);
            updateUIForLoggedInUser();
        })
        .catch(error => alert(error.message));
}

// Function to handle user signup
function signup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email
                });
            });
        })
        .then(() => {
            showSection(homeSection);
            updateUIForLoggedInUser();
        })
        .catch(error => alert(error.message));
}

// Function to handle user logout
function logout() {
    auth.signOut().then(() => {
        updateUIForLoggedOutUser();
        showSection(loginSection);
    }).catch(error => alert(error.message));
}

// Function to create a new post
function createPost(e) {
    e.preventDefault();
    const content = document.getElementById('postContent').value;
    const user = auth.currentUser;

    db.collection('posts').add({
        content: content,
        authorId: user.uid,
        authorName: user.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('postContent').value = '';
        loadPosts();
    }).catch(error => alert(error.message));
}

// Function to load posts
function loadPosts() {
    postsDiv.innerHTML = '';
    db.collection('posts').orderBy('timestamp', 'desc').get().then(snapshot => {
        snapshot.forEach(doc => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <div class="author">${post.authorName}</div>
                <div class="content">${post.content}</div>
                <div class="timestamp">${post.timestamp ? post.timestamp.toDate().toLocaleString() : 'Just now'}</div>
            `;
            postsDiv.appendChild(postElement);
        });
    });
}

// Function to load user info
function loadUserInfo() {
    const user = auth.currentUser;
    if (user) {
        userInfoDiv.innerHTML = `
            <h3>${user.displayName}</h3>
            <p>${user.email}</p>
        `;
    }
}

// Function to load user posts
function loadUserPosts() {
    userPostsDiv.innerHTML = '';
    const user = auth.currentUser;
    if (user) {
        db.collection('posts').where('authorId', '==', user.uid).orderBy('timestamp', 'desc').get().then(snapshot => {
            snapshot.forEach(doc => {
                const post = doc.data();
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <div class="content">${post.content}</div>
                    <div class="timestamp">${post.timestamp ? post.timestamp.toDate().toLocaleString() : 'Just now'}</div>
                `;
                userPostsDiv.appendChild(postElement);
            });
        });
    }
}

// Function to update UI for logged-in user
function updateUIForLoggedInUser() {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    homeBtn.style.display = 'inline-block';
    profileBtn.style.display = 'inline-block';
}

// Function to update UI for logged-out user
function updateUIForLoggedOutUser() {
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    homeBtn.style.display = 'none';
    profileBtn.style.display = 'none';
}

// Check initial auth state
auth.onAuthStateChanged(user => {
    if (user) {
        updateUIForLoggedInUser();
        showSection(homeSection);
    } else {
        updateUIForLoggedOutUser();
        showSection(loginSection);
    }
});