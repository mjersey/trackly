import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, verifyBeforeUpdateEmail } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { firebaseConfig } from "./env.js";

window.auth = null; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
window.auth = auth; 
const db = getFirestore(app);
const appId = "trackly-log-app"; 

let unsubLogs = null;
let unsubSettings = null;
let unsubState = null;

window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-auth-submit');
    const origText = btn.innerHTML; 
    
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';
    btn.classList.add('opacity-75', 'cursor-not-allowed');
    btn.disabled = true;

    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    
    try {
        if (window.isSignUpMode) {
            const name = document.getElementById('auth-name').value;
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
            
            await sendEmailVerification(userCredential.user);
            
            await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'settings', 'userProfile'), { 
                username: name,
                targetHours: 486,
                targetDate: ""
            }, { merge: true });

            await auth.signOut();
            window.openVerificationModal();
            
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            
            if (!userCredential.user.emailVerified) {
                window.showToast("Your email is not verified yet. Please check the link in your inbox.", "error");
                await auth.signOut();
            }
        }
    } catch (err) {
        console.error("Auth error:", err);
        let msg = "Login failed. Please check your credentials.";
        if(err.code === 'auth/email-already-in-use') msg = "This email is already in use.";
        if(err.code === 'auth/weak-password') msg = "Password is too short (at least 6 chars).";
        if(err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        window.showToast(msg, 'error');
    } finally {
        btn.innerHTML = origText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.disabled = false;
    }
};

window.handleResetPassword = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-reset-submit');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
    btn.disabled = true;

    const email = document.getElementById('reset-email').value;
    try {
        await sendPasswordResetEmail(auth, email);
        window.showToast("If an account exists, a reset link has been sent to your email!", "success");
        window.closeForgotPasswordModal();
    } catch (err) {
        console.error("Reset password error:", err);
        window.showToast("Failed to send reset link: " + err.message, "error");
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
};

window.handleOAuth = async function(providerName) {
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const docRef = doc(db, 'artifacts', appId, 'users', result.user.uid, 'settings', 'userProfile');
        await setDoc(docRef, { username: result.user.displayName || "Intern" }, { merge: true });
    } catch (err) {
        console.error("OAuth error:", err);
        window.showToast("Login failed: " + err.message, 'error');
    }
};

window.handleLogout = async function() {
    try {
        window.closeSettings();
        await signOut(auth);
        window.state.logs = [];
        window.state.currentShift = null;
        window.updateUI();
    } catch(e) { 
        console.error("Logout error", e); 
    }
};

onAuthStateChanged(auth, (user) => {
    if (user && (user.emailVerified || user.providerData.some(p => p.providerId !== 'password'))) {
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('app-dashboard').classList.remove('hidden');
        document.getElementById('app-dashboard').classList.add('flex');
        
        window.state.username = user.displayName || "Intern";
        document.getElementById('mobile-username').textContent = window.state.username;
        document.getElementById('desktop-username').textContent = window.state.username;
        
        window.requestNotificationPermission();
        setupListeners(user.uid);
        setTimeout(window.checkNotifications, 1500);
    } else {
        window.showLandingView();
        if(unsubLogs) unsubLogs();
        if(unsubSettings) unsubSettings();
        if(unsubState) unsubState();
    }
});

function setupListeners(uid) {
    unsubLogs = onSnapshot(collection(db, 'artifacts', appId, 'users', uid, 'logs'), (snapshot) => {
        window.state.logs = [];
        snapshot.forEach(docSnap => {
            window.state.logs.push({ id: docSnap.id, ...docSnap.data() });
        });
        window.state.logs.sort((a, b) => b.timeIn - a.timeIn); 
        window.updateUI();
    }, (err) => console.error("Logs error:", err));

    unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'users', uid, 'settings', 'userProfile'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.state.targetHours = data.targetHours || 486;
            window.state.targetDate = data.targetDate || "";
            if(data.username) window.state.username = data.username;
        }
        document.getElementById('mobile-username').textContent = window.state.username;
        document.getElementById('desktop-username').textContent = window.state.username;
        window.updateUI();
    }, (err) => console.error("Settings error:", err));

    unsubState = onSnapshot(doc(db, 'artifacts', appId, 'users', uid, 'state', 'currentShift'), (docSnap) => {
        if (docSnap.exists()) {
            window.state.currentShift = docSnap.data();
            window.showToast("▶️ Resumed active shift session.", "success");
        } else {
            window.state.currentShift = null;
        }
        window.updateUI();
    }, (err) => console.error("State error:", err));
}

window.saveSettings = async function() {
    if (!auth.currentUser) return;
    const btn = document.getElementById('btn-save-settings');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const uName = document.getElementById('setting-username').value || "Intern";
        const hours = parseFloat(document.getElementById('setting-hours').value);
        const tDate = document.getElementById('setting-date').value;
        const newEmail = document.getElementById('setting-email').value;

        if(newEmail && newEmail !== auth.currentUser.email) {
            try {
                await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
                window.showToast("Verification link sent to new email.", "success");
            } catch(e) {
                window.showToast("Email update error: " + e.message, "error");
                return;
            }
        }

        await setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'settings', 'userProfile'), {
            username: uName,
            targetHours: hours > 0 ? hours : 486,
            targetDate: tDate
        }, { merge: true });
        
        await updateProfile(auth.currentUser, { displayName: uName });
        window.closeSettings();
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
};

window.saveLogEntry = async function() {
    if (!auth.currentUser) return;
    const idStr = document.getElementById('entry-id').value;
    const dateStr = document.getElementById('entry-date').value;
    const timeInStr = document.getElementById('entry-time-in').value;
    const timeOutStr = document.getElementById('entry-time-out').value;
    const tasks = document.getElementById('entry-task').value || "Manual Entry";
    const deductBreak = document.getElementById('entry-break').checked;
    const tag = document.querySelector('input[name="entry-tag"]:checked').value;

    if(!dateStr || !timeInStr || !timeOutStr) {
        window.showToast("Please fill in all date and time fields.", "error");
        return;
    }

    const timeInObj = new Date(`${dateStr}T${timeInStr}`);
    const timeOutObj = new Date(`${dateStr}T${timeOutStr}`);
    if (timeOutObj <= timeInObj) timeOutObj.setDate(timeOutObj.getDate() + 1);

    let durationSec = Math.floor((timeOutObj - timeInObj) / 1000);
    if(deductBreak) durationSec = Math.max(0, durationSec - 3600);
    
    const logId = idStr ? idStr : Date.now().toString();
    const newLog = {
        dateObj: timeInObj.toISOString(),
        timeIn: timeInObj.getTime(),
        timeOut: timeOutObj.getTime(),
        durationSec: durationSec,
        tasks: tasks,
        tag: tag,
        breakDeducted: deductBreak
    };

    await setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs', logId), newLog);
    window.closeLogEntryModal();
};

window.toggleClockIn = async function() {
    if (!auth.currentUser) return;
    if (!window.state.currentShift) {
        const shiftData = { startTime: Date.now(), tasks: "" };
        await setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'state', 'currentShift'), shiftData);
    }
};

window.confirmClockOut = async function() {
    if (!auth.currentUser || !window.state.currentShift) return;
    const end = Date.now();
    let dur = Math.floor((end - window.state.currentShift.startTime) / 1000);
    const deduct = document.getElementById('lunchBreakToggle').checked;
    if (deduct) dur = Math.max(0, dur - 3600); 

    const logId = Date.now().toString();
    const newLog = {
        dateObj: new Date(window.state.currentShift.startTime).toISOString(),
        timeIn: window.state.currentShift.startTime,
        timeOut: end,
        durationSec: dur,
        tasks: document.getElementById('task-input').value || "Routine tasks.",
        tag: document.querySelector('input[name="tag"]:checked').value,
        breakDeducted: deduct
    };

    await setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs', logId), newLog);
    await deleteDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'state', 'currentShift'));
    window.document.getElementById('endShiftModal').classList.remove('active'); 
    document.body.style.overflow = ''; 
};

window.confirmDeleteLog = async function() {
    if (!auth.currentUser || window.logToDelete === null) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'logs', window.logToDelete.toString()));
    window.closeDeleteModal();
};