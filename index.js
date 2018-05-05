import { AppRegistry } from 'react-native';
import App from './App';

import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);
YellowBox.ignoreWarnings(['Warning: Failed prop type:']);
YellowBox.ignoreWarnings(['Module SQLite requires']);
YellowBox.ignoreWarnings(['Class RCTCxxModule was not exported.']);

AppRegistry.registerComponent('CarsSQLiteApp', () => App);
