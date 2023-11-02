import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  PermissionsAndroid,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import RNFetchBlob from 'react-native-fetch-blob';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';

import AudioRecorderPlayer from 'react-native-audio-recorder-player';
const audioRecorderPlayer = new AudioRecorderPlayer();
const App = () => {
  const [allData, setAllData] = useState([]);
  const permissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  console.log();
  useEffect(() => {
    permissions();
    const subscriber = firestore()
      .collection('chat')
      .onSnapshot(documentSnapshot => {
        // console.log('User data: ', documentSnapshot.data());
        const data = documentSnapshot.docs.map(data => data.data());
        setAllData(data);
        console.log('agsdau', data);
      });

    // Stop listening for updates when no longer required
    return () => subscriber();
  }, []);

  return (
    <View style={styles.container}>
      {allData.length !== 0 &&
        allData.map((data, index) => {
          return <Player key={index} data={data} />;
        })}
      <Recorder />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
export default App;

const Recorder = () => {
  const [isRecording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [TimerInterval, setTimerInterval] = useState('');
  const [soundPath, setSoundPath] = useState();

  const startRecording = async () => {
    setRecording(true);
    const result = await audioRecorderPlayer.startRecorder();
    setSoundPath(result);
    console.log('sound', result);
    let seconds = 0;
    const timerInterval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setTimer(
        `${String(minutes).padStart(2, '0')}:${String(
          remainingSeconds,
        ).padStart(2, '0')}`,
      );
    }, 1000); // Update the timer every second

    // Store the interval ID so we can clear it later
    setTimerInterval(timerInterval);
  };

  const stopRecording = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    clearInterval(TimerInterval);
    setRecording(false);
  };

  const sendMessage = async () => {
    setRecording(false);
    stopRecording();
    setTimer(0);
    const mimeType = 'audio/mpeg';
    const res = await RNFetchBlob.fs.readFile(soundPath, 'base64');
    const blobData = `data:${mimeType};base64,${res}`;

    const filename =
      new Date().getTime() + `.${mimeType.replace('audio/', '')}`;
    const reference = storage().ref(filename);
    await reference.putString(blobData, 'data_url');
    const mp3Url = await storage().ref(filename).getDownloadURL();
    const payload = {
      from: 'faizan',
      to: 'ali',
      sound: mp3Url,
    };
    firestore()
      .collection('chat')
      .add(payload)
      .then(() => {
        console.log('User added!');
      });
  };

  return (
    <View style={{marginTop: 100}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          justifyContent: 'space-between',
        }}>
        <Text>{timer}</Text>
        <Pressable
          style={{
            width: isRecording ? 55 : 50,
            height: isRecording ? 55 : 50,
            borderRadius: 50,
            backgroundColor: 'red',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={isRecording ? () => sendMessage() : () => startRecording()}>
          <Feather name="mic" size={isRecording ? 40 : 30} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
};

const Player = ({data}) => {
  const [isPlaying, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  if (startTime !== 0 && startTime === endTime) {
    audioRecorderPlayer.stopPlayer();
    setStartTime(0);
    setPlaying(false);
  }
  const startPlayback = async sound => {
    setPlaying(true);
    await audioRecorderPlayer.startPlayer(sound);
    audioRecorderPlayer.addPlayBackListener(e => {
      // audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)).split(':')[1],
      setStartTime(
        Number(
          audioRecorderPlayer
            .mmssss(Math.floor(e.currentPosition))
            .split(':')[1],
        ),
      );
      setEndTime(
        Number(
          audioRecorderPlayer.mmssss(Math.floor(e.duration)).split(':')[1],
        ),
      );
      console.log(
        audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)).split(':')[1],
        audioRecorderPlayer.mmssss(Math.floor(e.duration)).split(':')[1],
      );
      // setPlayingTime (
      //   audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)).split(':')[1],
      // );
    });
    console.log('running path');
    // await audioRecorderPlayer.startPlayer(path);
    // setPlaying(true);
  };

  const stopPlayback = async () => {
    await audioRecorderPlayer.stopPlayer();
    setPlaying(false);
  };

  return (
    <View>
      {/* <Text>{playingTime}</Text> */}
      <View style={{flexDirection: 'row'}}>
        <TouchableWithoutFeedback
          onPress={
            isPlaying
              ? () => stopPlayback(data.sound)
              : () => startPlayback(data.sound)
          }>
          {isPlaying ? (
            <AntDesign name="pause" size={30} color="#000" />
          ) : (
            <Feather name="play" size={30} color="#000" />
          )}
        </TouchableWithoutFeedback>

        <Slider
          style={{width: 200, height: 40}}
          value={startTime}
          minimumValue={0}
          maximumValue={endTime}
          minimumTrackTintColor="#57345734"
          maximumTrackTintColor="#000000"
        />
      </View>
    </View>
  );
};
