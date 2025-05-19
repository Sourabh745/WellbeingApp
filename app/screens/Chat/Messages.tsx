import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  StatusBar,
  TextInput,
} from 'react-native';
import {useAnimatedStyle, withSpring} from 'react-native-reanimated';
import {Attachment, Send} from '../../assets/svgs';
import {AnimatedBox, Box, MessageHeader, Screen} from '../../components';
import {colors} from '../../theme';
import {RouteProp, useFocusEffect, useRoute} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {
  sendMessage,
  updateAllDeliveryStatus,
  updateDeliveryStatus,
} from '../../db/helper';
import {EnhancedMessageItem} from '../../components/Chat';
import {$input} from '../../components/Chat/styles';
import {$localStreamContainer} from '../../components/VideoCall/styles';
import {useUser} from '../../hooks';
import {AppStackParamList} from '../../navigators';
import socket from '../../services/socket';
import {spacing} from '../../theme/spacing';
import {isAndroid} from '../../utils';
import {firebase} from '@react-native-firebase/firestore';



export const EnhancedMessages = ({route}: any) => {
  const {uid} = useUser();
  const UID = uid;
  const {params} = useRoute<RouteProp<AppStackParamList, 'Messages'>>();
  const {channelName, doctorID, channelSelfie} = params;
  const [messageInput, setMessageInput] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [resolvedRoomId, setResolvedRoomId] = useState<any>();
  const [channelExist, setChannelExist] = useState<any>();
  const flashListRef = useRef<FlashList<any>>(null);
  const [ChatRoom,setChatRooms] = useState<any[]>();

  const sendStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: messageInput?.length > 0 ? withSpring(1.27) : withSpring(0),
        },
      ],
    };
  });

  useEffect(() => {
    const db = firebase.firestore();
    const ids = [UID!, doctorID!].sort();

    const unsubscribe = db
      .collection('wellbeingMessages')
      .where('ids', '==', ids)
      .onSnapshot((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const msgs = doc.data().messages || [];
          msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setMessages(msgs);
        }
      });
    return () => unsubscribe();
  }, [UID, doctorID]);


  const getRoomId = async () => {
    const db = firebase.firestore();
    const ids = [UID!, doctorID!].sort();

    const channelExist = await db
      .collection('wellbeingMessages')
      .where('ids', '==', ids)
      .get();

    setChannelExist(channelExist)

    if (!channelExist.empty) {
      return channelExist.docs[0]?.data()?.roomId
    } else {
      return null
    }
  }

   useEffect(() => {
    // Only fetch roomId if it's not provided in route.params and it will call getRoomId().
    const fetchRoomId = async () => {
      const roomID = await getRoomId();
      if (!resolvedRoomId && !route?.params?.roomId) {
        try {
          setResolvedRoomId(roomID);
        } catch (error) {
          console.error('Error fetching room ID:', error);
        }
      };
    }
    fetchRoomId();
  }, [route?.params?.roomId]);

  //========================================================================
  useEffect(() => {
    const roomId = resolvedRoomId || route?.params?.roomId;
    if (!roomId) return;

    const db = firebase.firestore();
  
    const unsubscribe = db
      .collection('wellbeingMessages')
      .doc(roomId as string)
      .onSnapshot(async (docSnap) => {
        if (!docSnap.exists) {
          setMessages([]);
          return;
        }
        const data = docSnap.data();
        console.log("Messages data ::::", data);
        
        const newMessage = data?.messages || [];
        // Mark unread messages for current user as "read"
        const updatedMessages = newMessage.map((msg:any) => {
          if (msg.reciever == UID && msg.deliveryStatus !== 'read') {
            return {
              ...msg,
              deliveryStatus: 'read',
            };
          }
          return msg;
        });
  
        // If any message was updated, push the change
        
        const hasUpdates = newMessage.some( //getting error here because using messages from useState not the var we declared here to get real time message.

          (msg:any, i:any) => msg.deliveryStatus !== updatedMessages[i].deliveryStatus
        );
  
        if(hasUpdates) {
          try {
            await db.collection('wellbeingMessages')
              .doc(roomId as any)
              .update({ messages: updatedMessages });
          } catch (error) {
            console.error('Error updating read messages:', error);
          }
        }
        setMessages(updatedMessages);

      }, error => {
        console.error('Error in realtime listener:', error);
      });
  
    return () => unsubscribe();
  }, [resolvedRoomId, route?.params?.roomId, UID]);

//====================================================
  const getSenderInfo = async (senderId: any) => {
    const senderInfo = await firebase.firestore().collection('wellbeingUsers').doc(senderId).get();
    return senderInfo?.data()
  }
//====================================================

 //just now added
  useFocusEffect(
    useCallback(() => {
      // const userId = auth().currentUser?.uid;
      const userId = UID;
      if (!userId) return;
  
      let messageUnsubscribers: (() => void)[] = [];
      let userUnsubscriber: () => void;
  
      // setLoading(true);
  
      const setupListeners = async () => {
        const userRef = firebase.firestore().collection('wellbeingUsers').doc(userId);
  
        // Listen to user's channels in real-time
        userUnsubscriber = userRef.onSnapshot(async (userSnap) => {
          const userData = userSnap.data();
          const channels: string[] = userData?.channels || [];
  
          // Clean up previous listeners
          messageUnsubscribers.forEach(unsub => unsub());
          messageUnsubscribers = [];
  
          // const newRoomData: ChatRoom[] = [];
  
          channels.forEach((roomId) => {
            const unsub = firebase.firestore()
              .collection('wellbeingMessages')
              .doc(roomId)
              .onSnapshot(async (roomSnap) => {
                const data = roomSnap.data();
                if (!data) return;
  
                const senderId = data.ids?.find((uid: string) => uid !== userId);
                const senderData = await getSenderInfo(senderId);
  
                const updatedRoom = {
                  roomId,
                  lastMessage: data.lastMessage || '',
                  lastMessageTime: data.lastMessageTime?.toDate?.() || new Date(0),
                  senderName: senderData?.fullName || 'Unknown',
                  senderId,
                  senderSelfie: senderData?.pic || '',
                };
  
                // Update room if already exists or push new
                setChatRooms((prevRooms: any[] = []) => {
                  const others = prevRooms?.filter(room => room.roomId !== roomId);
                  const updated = [...others, updatedRoom];
                  updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
                  return updated;
                });
              });
  
            messageUnsubscribers.push(unsub);
          });
  
          // setLoading(false);
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
 

  const onPress = async () => {
    if (messageInput?.length > 0) {
      flashListRef.current?.scrollToIndex({
        animated: true,
        index: messages?.length - 1,
        viewOffset: 100,
      });

      let msgPayload = {
        doctor: doctorID,
        message: messageInput,
        patient: UID!,
        sender: UID!,
        deliveryStatus: 'pending',
      };

      try {
        const db = firebase.firestore();
        const ids = [UID!, doctorID!].sort();

        let channelRef;
        let channelId;

        const senderSnap = await db.collection('wellbeingUsers').doc(UID).get();
        const receiverSnap = await db.collection('wellbeingUsers').doc(doctorID).get();

        const senderName = senderSnap.data()?.fullName || 'Unknown';
        const receiverName = receiverSnap.data()?.fullName || 'Unknown';

        if (!channelExist.empty) {
          channelRef = channelExist.docs[0].ref;
          channelId = channelExist.docs[0].id;
        } else {
          channelRef = db.collection('wellbeingMessages').doc();
          channelId = channelRef.id;

          await channelRef.set({
            roomId: channelId,
            ids: ids,
            userNames: {
              [UID!]: senderName,
              [doctorID]: receiverName,
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            messages: [],
          });

          const senderRef = db.collection('wellbeingUsers').doc(UID);
          const receiverRef = db.collection('wellbeingUsers').doc(doctorID);

          await senderRef.update({
            channels: firebase.firestore.FieldValue.arrayUnion(channelId),
          });
          await receiverRef.update({
            channels: firebase.firestore.FieldValue.arrayUnion(channelId),
          });
        } //Else end here =============

        const newMessage = {
          id: Date.now().toString(),
          message: messageInput,
          sender: UID,
          reciever: doctorID,
          createdAt: new Date().toISOString(),
          deliveryStatus: 'sent', 
        };

        await channelRef.set(
          {
            roomId: channelId,
            ids: ids,
            userNames: {
              [UID!]: senderName,
              [doctorID]: receiverName,
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: messageInput,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            
            messages: firebase.firestore.FieldValue.arrayUnion({...newMessage}),
          },
          {merge: true},
        );
      } catch (error) {
        console.error('Error sending message:', error);
      }

      msgPayload.deliveryStatus = 'delivered';
      setMessageInput('');
      const message = await sendMessage(msgPayload);
      emitMessage(msgPayload, message?.id!);
    }
  };

  const emitMessage = (msgPayload: any, id: string) => {
    socket.volatile.emit(
      'message',
      {...msgPayload, messageID: id},
      async (response: any) => {
        const {deliveryStatus, messageID} = response;
        await updateDeliveryStatus(deliveryStatus, messageID);
      },
    );
    setMessageInput('');
  };

  useEffect(() => {
    (async () => {
      await updateAllDeliveryStatus('read', doctorID, 'doctor');
    })();
    if (messages.length > 0) {
      socket.emit('read', {
        deliveryStatus: 'read',
        doctor: doctorID,
        patient: UID,
      });
    }
  }, [messages]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAndroid) {
        StatusBar.setBackgroundColor(colors.chatInput);
      }
    }, []),
  );

  return (
    <Screen useTopPadding={false}>
      <KeyboardAvoidingView
        style={$localStreamContainer}
        behavior={!isAndroid ? 'padding' : undefined}>
        <Box flex={1}>
          <MessageHeader
            doctorID={doctorID}
            channelName={channelName}
            channelSelfie={channelSelfie}
          />
          <Box flex={1} flexGrow={6} paddingHorizontal="l">
            <FlashList
              ref={flashListRef}
              data={messages}
              showsVerticalScrollIndicator={false}
              estimatedItemSize={messages?.length || 250}
              onContentSizeChange={() => {
                if (messages?.length > 10) {
                  flashListRef?.current?.scrollToEnd({animated: true});
                }
              }}
              keyExtractor={item => item.id}
              getItemType={item => {
                return item.sender === UID ? 'patient' : 'doctor';
              }}
              renderItem={({item}) => (
                <EnhancedMessageItem item={item} UID={UID} />
              )}
            />
          </Box>

          <Box justifyContent="center" flexGrow={0.1}>
            <Box
              alignItems="center"
              paddingHorizontal="l"
              gap="n"
              flexDirection="row">
              <Box
                borderWidth={1}
                height={45}
                width={45}
                alignItems="center"
                backgroundColor="chatInput"
                justifyContent="center"
                borderRadius={spacing.borderRadius}
                borderColor="header">
                <Attachment />
              </Box>
              <AnimatedBox flex={1} borderRadius={spacing.borderRadius}>
                <TextInput
                  style={$input}
                  multiline={true}
                  value={messageInput}
                  keyboardType="default"
                  placeholder=" Type Something!"
                  placeholderTextColor={colors.black}
                  onChangeText={value => {
                    setMessageInput(value);
                  }}
                />
              </AnimatedBox>
              {messageInput?.length > 0 && (
                <AnimatedBox style={sendStyle}>
                  <Pressable hitSlop={40} onPress={onPress}>
                    <Send />
                  </Pressable>
                </AnimatedBox>
              )}
            </Box>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </Screen>
  );
};
