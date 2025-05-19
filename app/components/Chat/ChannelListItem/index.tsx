import {useNavigation} from '@react-navigation/native';
import React, { memo } from 'react';
import {Pressable} from 'react-native';
import {StackNavigation} from '../../../navigators';
import {formatAMPM, moderateScale} from '../../../utils';
import {Avatar} from '../../Avatar';
import {Box} from '../../Box';
import {Text} from '../../Text';

type ChannelListItemProps = {
  channel: any
};

export const ChannelListItem = memo(({channel:{lastMessage, lastMessageTime, senderName, senderId, senderSelfie}}: ChannelListItemProps) => {  

  // const {uid: UID} = useUser();
  const navigation = useNavigation<StackNavigation>();

  const onPress = () => {
    navigation.navigate('Messages', {
      doctorID: senderId,
      channelName: senderName,
      channelSelfie: senderSelfie,
      // roomId:roomId
    });
  };
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({pressed}) => [pressed ? {opacity: 0.4,marginTop:15} : {marginTop:15}]}>
        <Box flexDirection="row" gap="n">
          <Avatar
            uri={senderSelfie||""}
            wnh={50}
            doctorID={senderId}
          />
          <Box paddingVertical="i" flex={1}>
            <Box flex={1} flexDirection="row" justifyContent="space-between">
              <Text
                color="black"
                variant="mSemiBold"
                fontSize={moderateScale(15)}>
                {senderName}
              </Text>
              <Box justifyContent="space-between">
                <Text color="black" fontSize={moderateScale(12)}>
                  {formatAMPM(lastMessageTime)}
                </Text>
              </Box>
            </Box>
            <Box
              flex={1}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center">
              <Box flex={2}>
                <Text
                  variant={'regular'}
                  numberOfLines={1}
                  fontSize={moderateScale(14.5)}>
                  {lastMessage}
                </Text>
              </Box>
              {/* <Box flex={0.3} alignItems="flex-end">
                {senderId === UID ? (
                  <DeliveryStatus status={"channel.deliverStatus"} />
                ) : (
                  <>
                    {21 > 0 && (
                      <Box
                        borderRadius={100}
                        height={25}
                        width={25}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor="primary">
                        <Text
                          color="white"
                          variant="mSemiBold"
                          fontSize={moderateScale(12)}>
                          {"unread"}
                        </Text>
                      </Box>
                    )}
                  </>
                )}
              </Box> */}
            </Box>
          </Box>
        </Box>
      </Pressable>
    </>
  );
});


export const EnhancedChannelList = ChannelListItem;
