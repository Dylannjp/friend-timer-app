import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';

export default function TimerScreen() {
    const user = auth().currentUser
    const [status, setStatus] = useState('Idle');
    const [friendStatus, setFriendStatus] = useState('Offline');
    const [sessionStartTime, setSessionStartTime] = useState<firestore.Timestamp | null>(null);
    const [friendSessionStartTime, setFriendSessionStartTime] = useState<firestore.Timestamp | null>(null);
    const [isLoading, setIsLoading] = useState(true); 

    // Sync up the database and the app's UI
    useEffect(() => {
        const userId = user.uid;
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const subscriber = firestore()
            .collection('users')
            .doc(userId)
            .onSnapshot(documentSnapshot => {
                const userData = documentSnapshot.data();

                const serverStatus = userData?.status || 'Idle';
                const serverStartTime = userData?.sessionStartTime || null;

                // sync local react state with the data from firestore
                setStatus(serverStatus);
                setSessionStartTime(serverStartTime);
                setIsLoading(false);
            });

        // unsubscribe from the listener when the component is unmounted
        return () => subscriber();
    }, []);

    useEffect(() => {
        const userId = user.uid;
        if (!userId) {
            setIsLoading(false);
            return;
        }
        const setupFriendListener = async () => {
            try {
                const userDocumentSnapshot = await firestore().collection('users').doc(userId).get();
                const userData = userDocumentSnapshot.data();
                const friendId = userData?.friendUID;

                if (friendId) {
                    const subscriber = firestore()
                        .collection('users')
                        .doc(friendId)
                        .onSnapshot(documentSnapshot => {
                            const friendData = documentSnapshot.data();
                            const serverStatus = friendData?.status || 'Offline';
                            setFriendStatus(serverStatus); 
                        });
                    return () => subscriber();
                } 
                else {
                    console.log("No friendUID  ound for this user.");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error setting up friend listener:", error);
                setIsLoading(false);
            }
        };

        // Call the async function to start the process
        setupFriendListener();

    }, []); // The empty dependency array is correct

    const handleStart = async () => {
        try {
            const userId = user.uid;
            if (!userId) return;

            const startTime = firestore.Timestamp.now();

            await firestore().collection('users').doc(userId).set({
                status: 'Working',
                sessionStartTime: startTime,
                email: auth().currentUser?.email
            }, { merge: true });

            setStatus('Working');
            setSessionStartTime(startTime);

        } catch (error) {
            console.error("Error starting timer:", error);
            Alert.alert('Error', 'Could not start the timer.');
        }
    };

    const handleStop = async () => {
        try {
            const userId = user.uid;

            if (!userId || !sessionStartTime) return; // error checking

            const endTime = firestore.Timestamp.now();
            const customSessionId = sessionStartTime.toDate().toISOString();

            const sessionsCollectionRef = firestore()
            .collection('users')
            .doc(userId)
            .collection('sessions');

            await sessionsCollectionRef.doc(customSessionId).set({
                startTime: sessionStartTime,
                endTime: endTime,
            });

            await firestore().collection('users').doc(userId).update({
                status: 'Idle',
                sessionStartTime: firestore.FieldValue.delete(),
            });

            setStatus('Idle');
            setSessionStartTime(null);

        } catch (error) {
            console.error("Error stopping timer:", error);
            Alert.alert('Error', 'Could not stop the timer.');
        }
    };

    const handleLogout = () => {
        auth().signOut();
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text>userID: {user.uid}</Text>
            <Text style={styles.title}>Your Status</Text>
            <Text style={styles.statusText}>{status}</Text>
            <Text style={styles.title}>Your Friend's Status</Text>
            <Text style={styles.statusText}>{friendStatus}</Text>

            <View style={styles.buttonContainer}>
                <Button title="Start Timer" onPress={handleStart} disabled={status === 'Working'} />
                <Button title="Stop Timer" onPress={handleStop} disabled={status === 'Idle'} />
            </View>

            <View style={styles.logoutButton}>
                <Button title="Logout" onPress={handleLogout} color="#c0392b" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    statusText: {
        fontSize: 20,
        color: '#34495e',
        marginBottom: 30,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '80%',
        justifyContent: 'space-around',
    },
    logoutButton: {
        position: 'absolute',
        bottom: 50,
        width: '50%',
    },
});