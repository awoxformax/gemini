import Reactotron from 'reactotron-react-native';

Reactotron
  .configure({ name: 'Overage App' })
  .useReactNative({
    networking: true, 
  })
  .connect();

console.tron = Reactotron;