/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import Aes from 'react-native-aes-crypto';
import base64 from 'react-native-base64';
import {launchImageLibrary} from 'react-native-image-picker';

const App = () => {
  // __________________________PART 1 SOLUTION__________________________
  const [userToken, setUserToken] = useState('');

  //Function to convert string to Base64
  const toBase64 = text => {
    return base64.encode(text);
  };

  //String encryption function
  const encrypt = async (text, key) => {
    //Generate random 16 character string for IV
    let iv = await Aes.randomKey(16);
    //Encrypt the message using provided key
    let ans = await Aes.encrypt(text, key, iv, 'aes-128-cbc').then(cipher => ({
      cipher,
      iv,
    }));

    //Print out the raw_cipher
    console.log('raw_cipher', ans.cipher);
    //Encode the IV + raw_cipher to a base
    let base64 = toBase64(ans.iv + ans.cipher);
    console.log('Base64: ', base64);
    generateTokenFromAPI(base64);
  };

  const generateTokenFromAPI = async base64 => {
    //Sending post request to API
    const req = 'https://www.instantpay.in/ws/AndroidRecruitmentTest/getToken';
    const body = JSON.stringify({
      ciphertext: base64,
    });
    let res = await fetch(req, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body,
    });

    //Setting the userToken from API response
    let response = await res.json();
    if (response.resp == 1) {
      setUserToken(response.token);
    }
  };

  //Call the encrypt function
  useEffect(() => {
    encrypt(
      'This is some sample plaintext data to encrypt',
      'ab821eb4b7d352cd65e84c5a7f38dbb0966262c651cf7064a0d821d8b2a20a5a',
    );
  }, []);

  // __________________________PART 2 SOLUTION__________________________
  const [imageUri, setImageUri] = useState('');

  const uploadImage = () => {
    const options = {
      mediaType: 'photo',
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        // alert('User cancelled camera picker');
        return;
      } else if (response.errorCode == 'camera_unavailable') {
        alert('Camera not available on device');
        return;
      } else if (response.errorCode == 'permission') {
        alert('Please grant camera permissions in settings');
        return;
      } else if (response.errorCode == 'others') {
        alert(response.errorMessage);
        return;
      } else if (response && response.assets) {
        const pic = response.assets[0];
        const imageData = {pic};
        postPic(imageData.pic);
      }
    });
  };

  //make id for image name
  const makeID = () => {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  //Post pic to api
  const postPic = async file => {
    let req = 'https://www.instantpay.in/ws/AndroidRecruitmentTest/uploadImage';

    console.log('This is the file: ', file);

    //Add image details to form data
    let formData = new FormData();
    formData.append('pic', {
      //Format uri to send for android and ios
      uri:
        Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
      type: 'image/jpg',
      name: `${makeID()}.jpg`,
    });
    const res = await fetch(req, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userToken}`,
      },
      body: formData,
    });

    const response = await res.json();

    //Set image Uri from Api response
    setImageUri(response.link);
  };

  return (
    <View style={styles.mainContainer}>
      {/* if image uri is present show the image, else don't show anything */}
      {imageUri ? <Image source={{uri: imageUri}} /> : null}
      <TouchableOpacity onPress={uploadImage}>
        <Text>Upload Image</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
