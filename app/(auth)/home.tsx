import auth from '@react-native-firebase/auth';
import { Button, Text, View } from 'react-native';

const Page = () => {
    const user = auth().currentUser;
    return(
        <View>
            <Text>Welcome back {user?.email}</Text>
            <Button title = "Sign Out" onPress={() => auth().signOut()} />
        </View>
        )
    };
export default Page