import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDiQISTMea-z9H7Gdd5oR3hTrrTSJ6_VvM",
  authDomain: "justmine-tea.firebaseapp.com",
  projectId: "justmine-tea",
  storageBucket: "justmine-tea.firebasestorage.app",
  messagingSenderId: "567738805461",
  appId: "1:567738805461:web:06b546c1d723eabfea865c",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)