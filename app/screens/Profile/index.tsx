import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, {useState} from 'react';
import {useMMKVString} from 'react-native-mmkv';
import {Basic, Language, Lock, Logout, Trash} from '../../assets/svgs';
import {Avatar, Box, Header, ProfileItem, Screen, Text} from '../../components';
import {storage} from '../../data';
import {StackNavigation} from '../../navigators';
import {moderateScale} from '../../utils';
export const Profile = () => {
  const navigation = useNavigation<StackNavigation>();
  const [userObject, _] = useMMKVString('user');
  const user = userObject && JSON.parse(userObject!);

  const [loading, setLoading] = useState<boolean>(false);
  const signOut = async () => {
    setLoading(true);
    storage.set('user', '');
    await GoogleSignin.revokeAccess(); // add this line because when trying to logging in again it's not asking email selection just using old credentials
    await GoogleSignin.signOut(); // this line is also added here
    await auth().signOut();
  };
  const changeLanguage = () => {
    navigation.navigate('ChangeLanguage');
  };

  //Delete account
  const deleteAccount = async() => {
    console.log("account that you want to delete ::::", user);
    try {
    
    const currUser = auth().currentUser; // get current logging in user 
    if(currUser){
      await currUser.delete();
      console.log("User successfully deleted",currUser);
      signOut();
    }
    else{
      console.log('No user is currently signed in');
      signOut();
    }
    } catch (error) {
      console.log("Error get while deleting account ::::", error);
    }
  }

  return (
    <Screen useAlignment isLoading={loading}>
      <Box mt="l">
        <Header useDefault={false} summaryKey={'Profile'} titleKey={''} />
      </Box>

      <Box mt="s">
        <Box gap="n" flexDirection="row" alignItems="center">
          <Avatar wnh={65} uri={user.pic} />
          <Box gap="nn">
            <Text
              variant="mSemiBold"
              letterSpacing={0.2}
              fontSize={moderateScale(15)}
              adjustsFontSizeToFit>
              {user.fullName}
            </Text>
            <Text color="grey">Patient</Text>
          </Box>
        </Box>

        <Box ml="ii" marginTop="ll">
          <ProfileItem
            bg="primary300"
            icon={<Basic />}
            title="Basic Information"
            onPress={() => {}}
          />
          <ProfileItem
            bg="tomatoLight"
            icon={<Language />}
            title="Change Language"
            onPress={changeLanguage}
          />
          <ProfileItem
            bg="black"
            icon={<Lock />}
            title="Privacy Policy"
            onPress={() => {}}
          />
          <ProfileItem
            bg="error"
            icon={<Trash />}
            title="Delete Account"
            onPress={deleteAccount}
          />
          <ProfileItem
            bg="blueLight"
            icon={<Logout />}
            title="Logout"
            onPress={signOut}
          />
        </Box>
      </Box>
    </Screen>
  );
};
