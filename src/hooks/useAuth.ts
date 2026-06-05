// import { useEffect } from 'react';
// import { useAppDispatch, useAppSelector } from '@/store';
// import { auth } from '@/core/firebase'; // Исправил опечатку в пути core/core/
// import { onAuthStateChanged, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
// import { setUser, setFallbackMode, setLoading } from '@/store/slices/authSlice';
// import { IUser } from '@/core/types';

// export const useAuth = () => {
//   const dispatch = useAppDispatch();
  
//   // Импортируем хуки строго из @/store, как договаривались
//   const { user, isFallback, loading } = useAppSelector((state) => state.auth);

//   useEffect(() => {
//     const initAuth = async (): Promise<void> => {
//       try {
//         await signInAnonymously(auth);
//       } catch (err) {
//         console.warn("Firebase Auth blocked. Switching to local fallback.");
        
//         let localId = localStorage.getItem('linguaboost_local_uid');
//         if (!localId) {
//           localId = `local_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
//           localStorage.setItem('linguaboost_local_uid', localId);
//         }
        
//         dispatch(setFallbackMode(localId));
//       }
//     };

//     initAuth();

//     // Типизируем параметр usr встроенным типом User из firebase/auth
//     const unsubscribe = onAuthStateChanged(auth, (usr: FirebaseUser | null) => {
//       if (usr) {
//         // Формируем объект, строго соответствующий нашему интерфейсу IUser
//         const userData: IUser = {
//           uid: usr.uid,
//           email: usr.email || 'Гостевой профиль',
//           isAnonymous: usr.isAnonymous
//         };
//         dispatch(setUser(userData));
//       } else if (!isFallback) {
//         dispatch(setLoading(false));
//       }
//     });

//     return () => unsubscribe();
//   }, [dispatch, isFallback]);

//   return { user, loading };
// };


// ВРЕМЕННЫЙ ХУК ДЛЯ СТАДИИ ВЕРСТКИ
export const useAuth = () => {
  return {
    user: {
      uid: 'dev_user_123',
      email: 'tester@linguaboost.dev',
      isAnonymous: true,
    },
    loading: false, // Загрузка мгновенно завершена
  };
};