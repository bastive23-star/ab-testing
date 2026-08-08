import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            'AIzaSyBV_rIM1aMGIiykr1O7XiTDGCNqdx34jFg',
  authDomain:        'ab-testing-fb445.firebaseapp.com',
  projectId:         'ab-testing-fb445',
  storageBucket:     'ab-testing-fb445.firebasestorage.app',
  messagingSenderId: '109453198178',
  appId:             '1:109453198178:web:faa66aca6cc3bfce20623b',
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)
