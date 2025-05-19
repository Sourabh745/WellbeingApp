import firestore, {
  addDoc,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {useState} from 'react';
import {useMMKVString} from 'react-native-mmkv';
import {storage} from '../data';
import {APPOINTMENTS, USERS} from '../services';
import {delay} from '../utils';

export const useFirestore = (loading: boolean = true) => {
  const [userObject, _] = useMMKVString('user');
  const user = userObject && JSON.parse(userObject!);

  const {uid} = user ? user : {uid: ''};
  const [data, setData] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);

  const [isLoading, setLoading] = useState<boolean>(loading);
  const [error, setError] = useState<boolean>();

  const recommendedDoctors = async () => {
    try {
      //true :just for testing
      const collection = await firestore()
        .collection(USERS)
        .where('userType', '==', 'doctor')
        .where('verified', '==', false)
        .limit(5)
        .get();

      const newData = collection.docs.map(doc => ({...doc.data()}));
      setData(newData);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };
  const getUser = async (userID: string) => {
    const user = (await firestore().collection(USERS).doc(userID).get()).data();
    return user;
  };
  const specialistDoctors = async (area: string) => {
    try {
      //true :just for testing
        console.log("Speciality::::",area)
      const collection = await firestore()
        .collection(USERS)
        .where('userType', '==', 'doctor')
        .where('verified', '==', true)
        .where('specialty', '==', area)
        .get();
      const newData = collection.docs.map(doc => ({...doc.data()}));
      
      setData(newData);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const checkIfSlotExists = async (doctorId: string, userId: any, date: any, time: any) => {
  const snapshot = await firestore()
    .collection(APPOINTMENTS)
    .where('doctorID', '==', doctorId)
    .where('patientID', '==', userId)
    .where('appointmentDate', '==', date)
    .get();

  return !snapshot.empty; // true if exists
};

  const bookAppointment = async (
    doctorID: string,
    appointmentDate: any,
    appointmentTime: any,
  ) => {
    setLoading(true);
    try {
      const alreadyExists = await checkIfSlotExists(doctorID, uid, appointmentDate, appointmentTime);
      console.log("Appointment already exists ::::", alreadyExists)
      console.log(" Appointment time is ::::", appointmentTime)
      if (alreadyExists) {
          alert('You already have an appointment booked at this time.');
          return;
      }
      const docRef = await addDoc(firestore().collection(APPOINTMENTS), {
        patientID: uid,
        doctorID,
        bookingDate: new Date(),
        appointmentDate,
        appointmentTime,
      });
      if (docRef.id) {
        await delay(2000);
        setLoading(false);
        setData([{bookingStatus: true}]);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const appointmentTiming = async (appointmentDate: string) => {
    try {
      const collection = await firestore()
        .collection(APPOINTMENTS)
        .where('patientID', '==', uid)
        .where('appointmentDate', '==', appointmentDate)
        .get();

      const newData = collection.docs.map(doc => ({...doc.data()}));
      setData(newData);
      await delay(2500);
      setLoading(false);
    } catch {
      setLoading(false);
      setError(true);
    }
  };
  const upcoming = async () => {
    try {
      const collection = await firestore()
        .collection(APPOINTMENTS)
        .where('patientID', '==', uid)
        .get();
      const newData = collection.docs
        .map(doc => ({...doc.data()}))
        .filter(d => new Date(d.appointmentTime[0].startTime) >= new Date())[0];
      if (newData.length === 0) {
        setData([]);
      } else {
        setData([newData]);
      }
      setLoading(false);
    } catch {
      setLoading(false);
      setError(true);
    }
  };

  const updateProfile = async (patientID: string, profileObj: any) => {
    setLoading(true);

    const collection = firestore().collection(USERS).doc(patientID);

    await collection
      .update({...profileObj})
      .then(() => {
        setLoading(false);
        storage.set('user', JSON.stringify(profileObj));
        setData([{updateStatus: true}]);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  };

  return {
    recommendedDoctors,
    updateProfile,
    isLoading,
    data,
    appointmentTiming,
    upcoming,
    error,
    getUser,
    specialistDoctors,
    bookAppointment,
  };
};
function alert(arg0: string) {
  throw new Error('Function not implemented.');
}

