import React from 'react';
import {Box, Text} from '..';
import {moderateScale, startEndTime} from '../../utils';

type ChipProps = {
  item: any;
  active: boolean;
  disabled: any;
};
export const Chip = ({item, active,disabled}: ChipProps) => {
  console.log("clicked on no.",active);
  console.log("clicked on item",item);
  
  return (
    <Box
      backgroundColor={disabled ? 'grey' : active ? 'primary300' : 'primary'}
      height={45}
      paddingHorizontal="n"
      justifyContent="center"
      borderWidth={1}
      borderRadius={100}
      opacity={disabled ? 0.5 : 1}
      borderColor="border">
      <Text
        variant={active ? 'mSemiBold' : 'medium'}
        color="black"
        fontSize={moderateScale(14)}>
        {startEndTime(item?.startTime, item.endTime)}
      </Text>
    </Box>
  );
};
