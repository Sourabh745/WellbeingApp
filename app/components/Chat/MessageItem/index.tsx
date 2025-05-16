import React, { useEffect } from 'react';
import {spacing} from '../../../theme/spacing';
import {formatAMPM, moderateScale} from '../../../utils';
import {Box} from '../../Box';
import {Text} from '../../Text';
import {DeliveryStatus} from '../DeliveryStatus';

type MessageItemProps = {
  item: any;
  UID: any;
};

//TODO: Refactor chat item.
const MessageItem = ({item, UID}: MessageItemProps) => {
  console.log("ITEMS ::::", item);
  

  if (item.sender === UID) {
    return (
      <Box maxWidth={'85%'} alignSelf={'flex-end'}>
        <Box
          backgroundColor={'primary300'}
          marginVertical="s"
          flexWrap="wrap"
          flexDirection="row"
          paddingHorizontal="n"
          paddingVertical="xs"
          overflow="hidden"
          borderRadius={spacing.l}>
          <Text
            variant="regular"
            color="black"
            pr="xs"
            pb="ii"
            fontSize={moderateScale(16)}>
            {item.message}
          </Text>
          <Box
            flexDirection="row"
            justifyContent="flex-end"
            alignItems="flex-end"
            flexGrow={1}>
            <Text fontSize={moderateScale(12)} color="greyL">
            {formatAMPM(new Date(item.createdAt))}
            </Text>
            <Box pl="ii" alignItems="flex-end">
              <DeliveryStatus status={item.deliveryStatus} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  } else {
    return (
      <Box maxWidth={'85%'} alignSelf={'flex-start'}>
        <Box
          backgroundColor={'greyLight2'}
          marginVertical="s"
          flexWrap="wrap"
          flexDirection="row"
          paddingHorizontal="n"
          paddingVertical="xs"
          overflow="hidden"
          borderRadius={spacing.l}>
          <Text
            variant="regular"
            color="black"
            pr="xs"
            pb="ii"
            fontSize={moderateScale(16)}>
            {item.message}
          </Text>
          <Box
            flexDirection="row"
            justifyContent="flex-end"
            alignItems="flex-end"
            flexGrow={1}>
            <Text fontSize={moderateScale(12)} color="greyL">
            {formatAMPM(new Date(item.createdAt))}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }
};

export const EnhancedMessageItem = MessageItem;
