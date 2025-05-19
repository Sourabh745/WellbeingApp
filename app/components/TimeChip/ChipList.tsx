import React, {useEffect, useState} from 'react';
import {Pressable} from 'react-native';
import {Box} from '..';
import {Chip} from './Chip';
import {firebase} from '@react-native-firebase/firestore';
import {useUser} from '../../hooks/useUser';
import {APPOINTMENTS} from '../../services';

type ChipListProps = {
  availableTime: any;
  onTimeSelected: (activeItem: any) => void;
  doctorID: any;
  selectedDate: any;
};

export const ChipList = ({
  availableTime,
  onTimeSelected,
  doctorID,
  selectedDate,
}: ChipListProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [userBookedTimes, setUserBookedTimes] = useState<string[]>([]);
  const {uid} = useUser();
  const UID = uid;

  //to fetch appoitment detail
  useEffect(() => {
    const updateSelecteDate = selectedDate.toISOString().slice(0, 10);
 
    const fetchUserAppointments = async () => {
      const snapshot = await firebase
        .firestore()
        .collection(APPOINTMENTS)
        .where('patientID', '==', UID)
        .where('doctorID', '==', doctorID)
        .get();
      const booked: any[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const dateObj = data.appointmentDate;
      console.log("DateObj ::::", dateObj);
      

      if (dateObj === updateSelecteDate) {
        const times = (data.appointmentTime || []).map((t: { startTime: { seconds: any; }; }) => t.startTime?.seconds);
        booked.push(...times);
      }
    });
    setUserBookedTimes(booked.filter(Boolean));
    };

    if (UID && doctorID && selectedDate) {
      fetchUserAppointments();
    }
  }, [UID, doctorID, selectedDate]);

  const isBookedByUser = (startTime: any) => {
    return userBookedTimes.includes(startTime?.seconds); // Adjust if item.time is a Date object
  };

  const onPress = (index: number, item: any) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      onTimeSelected([]);
    } else {
      setSelectedIndex(index);
      onTimeSelected([item]);
    }
  };

  return (
    <Box gap="m" mt="n" flexDirection="row" flexWrap="wrap">
      {availableTime?.map((item: any, index: number) => {

        const disabled = isBookedByUser(item?.startTime);
        return (
          <Pressable
            key={index}
            onPress={() => onPress(index, item)}
            disabled={disabled}>
            <Chip
              item={item}
              active={index === selectedIndex}
              disabled={disabled}
            />
          </Pressable>
        );
      })}
    </Box>
  );
};
