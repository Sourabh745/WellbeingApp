import {FlashList} from '@shopify/flash-list';
import React, { useCallback, useEffect, useState } from 'react';
import {Text, View} from 'react-native';
import {Box, Header, Screen} from '../../components';
import {EnhancedChannelList} from '../../components/Chat';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

type ChatRoom = {
  roomId: string;
  lastMessage: string;
  lastMessageTime: Date;
  senderName: string;
  senderId: string;
  senderSelfie: string
};

export const ChatList = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  const getSenderInfo = async (senderId: any) => {
    const senderInfo = await firestore().collection('wellbeingUsers').doc(senderId).get();
    return senderInfo?.data()
  }


   useFocusEffect(
    useCallback(() => {
      const userId = auth().currentUser?.uid;
      if (!userId) return;
  
      let messageUnsubscribers: (() => void)[] = [];
      let userUnsubscriber: () => void;
    
      const setupListeners = async () => {
        const userRef = firestore().collection('wellbeingUsers').doc(userId);
  
        // Listen to user's channels in real-time
        userUnsubscriber = userRef.onSnapshot(async (userSnap) => {
          const userData = userSnap.data();
          const channels: string[] = userData?.channels || [];
  
          // Clean up previous listeners
          messageUnsubscribers.forEach(unsub => unsub());
          messageUnsubscribers = [];
  
          const newRoomData: ChatRoom[] = [];
  
          channels.forEach((roomId) => {
            const unsub = firestore()
              .collection('wellbeingMessages')
              .doc(roomId)
              .onSnapshot(async (roomSnap) => {
                const data = roomSnap.data();
                if (!data) return;
  
                const senderId = data.ids.find((uid: string) => uid !== userId);
                const senderData = await getSenderInfo(senderId);
  
                const updatedRoom = {
                  roomId,
                  lastMessage: data.lastMessage || '',
                  lastMessageTime: data.lastMessageTime?.toDate?.() || new Date(0),
                  senderName: senderData?.fullName || 'Unknown',
                  senderId,
                  senderSelfie: senderData?.selfie || '',
                };
  
                // Update room if already exists or push new
                setChatRooms((prevRooms) => {
                  const others = prevRooms.filter(room => room.roomId !== roomId);
                  const updated = [...others, updatedRoom];
                  updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
                  return updated;
                });
              });
  
            messageUnsubscribers.push(unsub);
          });
  
        });
      };
  
      setupListeners();
  
      return () => {
        // Cleanup listeners
        userUnsubscriber?.();
        messageUnsubscribers.forEach(unsub => unsub());
      };
    }, [])
  );

  return (
    <Screen useAlignment>
      <Box mt="l">
        <Header useDefault={false} summaryKey={'Chats'} titleKey={''} />
      </Box>

      <Box flex={1} mt="ll">
        {chatRooms?.length > 0 ? <FlashList
          data={chatRooms}
          estimatedItemSize={200}
          keyExtractor={(item) => item.roomId}
          renderItem={({ item }) => <EnhancedChannelList channel={item} />}
        /> :
          <View style={{ flex: 1, alignItems:"center", justifyContent:"center" }}>
            <Text style={{ color: "black",textAlign:"center" }}>No chat available</Text>
          </View>}
      </Box>
    </Screen>
  );
};

export const EnhancedChat = ChatList;
