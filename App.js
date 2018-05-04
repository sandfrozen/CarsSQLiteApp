import React from 'react';
import { View, Text, Button, Easing, Animated, ScrollView } from 'react-native';
import { StackNavigator } from 'react-navigation';
import { Icon, ButtonGroup } from 'react-native-elements'

class CarsScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params || {};

    return {
      headerLeft: (
        <Icon
          raised
          name='search'
          type='material-icons'
          color='darkblue'
          onPress={params._goToSearch} />
      ),
      headerTitle: params && params.cars ? 'Cars: ' + params.cars : 'Cars',
      headerRight: (
        <Icon
          raised
          name='add'
          type='material-icons'
          color='green'
          onPress={params._goToAdd} />
      ),
      headerBackTitle: 'Cars',
    }
  };

  componentWillMount() {
    this.props.navigation.setParams({ _goToSearch: this.goToSearch });
    this.props.navigation.setParams({ _goToAdd: this.goToAdd });
  }

  goToSearch = () => {
    this.props.navigation.navigate('Search');
  }

  goToAdd = () => {
    this.props.navigation.navigate('Add');
  }

  getCarsFromDb() {
    let carsCount = 12;
    this.props.navigation.setParams({ cars: carsCount });
  }

  deleteCar({ carId: id }) {
    console.log("Cars recieved id: " + id);
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Cars Screen</Text>
        <Button
          title="Go to Details"
          onPress={() => {
            /* 1. Navigate to the Details route with params */
            this.props.navigation.navigate('Details', {
              itemId: 86,
              otherParam: 'anything you want here',
              CarsScreen: this,
            });
          }}
        />
        <Button
          title="Update the title"
          onPress={() => this.getCarsFromDb()}
        />
      </View>
    );
  }
}


class DetailsScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.props.navigation.setParams({ _deleteCar: this.deleteCar });
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: params ? params.otherParam : 'A Nested Details Screen',
      headerRight: (
        <Icon
          raised
          name='delete'
          type='material-icons'
          color='darkred'
          onPress={params._deleteCar} />
      ),
    }
  };

  deleteCar = () => {
    this.props.navigation.state.params.CarsScreen.deleteCar({ carId: 1 });
    this.props.navigation.goBack();
  }

  render() {
    /* 2. Read the params from the navigation state */
    const params = this.props.navigation.state.params;
    const itemId = params ? params.itemId : null;
    const otherParam = params ? params.otherParam : null;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Details Screen</Text>
        <Text>itemId: {JSON.stringify(itemId)}</Text>
        <Text>otherParam: {JSON.stringify(otherParam)}</Text>
        <Button
          title="Go back"
          onPress={() => this.props.navigation.goBack()}
        />
      </View>
    );
  }
}

class AddScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: 'Add Car',
    }
  };

  addCar = () => {
    //this.props.navigation.state.params.CarsScreen.addCar({ carId: 1 });
    this.props.navigation.goBack();
  }


  render() {
    const component1 = () => <Text style={{ color: '#007aff', fontSize: 16 }}>Cancel</Text>
    const component2 = () => <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
    const buttons = [{ element: component1 }, { element: component2 }]
    /* 2. Read the params from the navigation state */
    const params = this.props.navigation.state.params;
    const nextId = params ? params.nextId : null;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ScrollView>
          <Text>AddCar Screen</Text>
          <Text>nextId: {JSON.stringify(nextId)}</Text>
        </ScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ widht: '100%', position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 1 ? this.props.navigation.goBack() : this.props.navigation.goBack()}
        />
      </View>
    );
  }
}

class SerachScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: 'Search',
    }
  };

  addCar = () => {
    this.props.navigation.state.params.CarsScreen.searchCars({ carId: 1 });
    this.props.navigation.goBack();
  }

  render() {
    const component1 = () => <Text style={{ color: '#007aff', fontSize: 16 }}>Back</Text>
    const component2 = () => <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 16 }}>Serach</Text>
    const buttons = [{ element: component1 }, { element: component2 }]
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ScrollView>
        <Text>Search Screen</Text>
      </ScrollView>
      <ButtonGroup
        buttons={buttons}
        containerStyle={{ widht: '100%', position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
        onPress={(index) => index == 1 ? this.props.navigation.goBack() : this.props.navigation.goBack()}
      />
    </View>
    );
  }
}

const RootStack = StackNavigator(
  {
    Cars: {
      screen: CarsScreen,
    },
    Details: {
      screen: DetailsScreen,
    },
    Add: {
      screen: AddScreen,
    },
    Search: {
      screen: SerachScreen,
    },
  },
  {
    initialRouteName: 'Cars',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 1000,
        easing: Easing.out(Easing.poly(10)),
        timing: Animated.timing,
      },
      screenInterpolator: sceneProps => {
        const { layout, position, scene } = sceneProps;
        const { index } = scene;

        const height = layout.initHeight;
        const translateY = position.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [height, 0, 0],
        });

        const opacity = position.interpolate({
          inputRange: [index - 1, index - 0.99, index],
          outputRange: [0, 1, 1],
        });

        return { opacity, transform: [{ translateY }] };
      },
    }),
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}