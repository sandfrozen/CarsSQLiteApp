import { AppRegistry } from 'react-native';
import App from './App';

import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);
YellowBox.ignoreWarnings(['Warning: Failed prop type:', 'Module RCTImageLoader']);

AppRegistry.registerComponent('CarsSQLiteApp', () => App);
