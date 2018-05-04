import React from 'react';
import { View, Text, Button, Easing, Animated, ScrollView, ListView } from 'react-native';
import { StackNavigator } from 'react-navigation';
import { Icon, ButtonGroup } from 'react-native-elements'
import { List, ListItem, Tile } from 'react-native-elements'

var SQLite = require('react-native-sqlite-storage');
var db = SQLite.openDatabase("carsDB.db");

class CarsScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      carList: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    };

    this.renderRow = this.renderRow.bind(this);
  }

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
    this.getCarsFromDb();
    this.props.navigation.setParams({ _goToSearch: this.goToSearch });
    this.props.navigation.setParams({ _goToAdd: this.goToAdd });
  }

  goToSearch = () => {
    this.props.navigation.navigate('Search');
  }

  goToAdd = () => {
    this.props.navigation.navigate('Add');
  }

  errorCB(err) {
    console.log("SQL Error: " + err);
  }

  successCB() {
    console.log("SQL executed fine");
  }

  openCB() {
    console.log("Database OPENED");
  }

  checkDatabase() {
    db.transaction((tx) => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS `Cars` (`id` INTEGER, `name` TEXT, `model`	TEXT, `color`	TEXT, `doors`	INTEGER, `year`	INTEGER, `km`	INTEGER, `price`	REAL, PRIMARY KEY(`id`) );', [], (tx, results) => {
        console.log("CREATE completed");
        console.log(tx);
        console.log(results);
      });
    });
    // db.transaction((tx) => {
    //   tx.executeSql('INSERT INTO `Cars`(`name`,`model`,`color`,`doors`,`year`,`km`,`price`) VALUES ("Volvo","V40","blue",4,2018,123,321.32);', [], (tx, results) => {
    //     console.log("INSERT completed");
    //     console.log("Rows Affected: " + results.rowsAffected);
    //     console.log("Insert ID: " + results.insertId);
    //   });
    // });
    this.getCarsFromDb();
  }

  getCarsFromDb() {
    db.transaction((tx) => {
      tx.executeSql('SELECT * FROM Cars;', [], (tx, results) => {
        console.log("SELECT completed");
        var temp = [];
        let len = results.rows.length;
        for (let i = 0; i < len; i++) {
          temp.push(results.rows.item(i));
        }
        this.setState({
          carList: this.state.carList.cloneWithRows(temp),
        });
        this.props.navigation.setParams({ cars: temp.length });
      });
    });
  }

  deleteCar({ carId: id }) {
    console.log("Cars recieved id: " + id);
  }

  renderRow(rowData, sectionID) {
    return (
      <ListItem
        leftIcon={{ name: 'directions-car' }}
        title={rowData.name + " " + rowData.model}
        subtitle={rowData.km + " km" + "  /  " + (rowData.price).toFixed(2) + " PLN"}
        rightIcon={{ name: 'chevron-right' }}
        onPress={() => {
          /* 1. Navigate to the Details route with params */
          this.props.navigation.navigate('Details', {
            car: rowData,
            CarsScreen: this,
          });
        }}
      />
    )
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ScrollView style={{ width: "100%" }}>
          <List>
            <ListView
              dataSource={this.state.carList}
              renderRow={this.renderRow}
              enableEmptySections={true}
            />
          </List>
        </ScrollView>
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
      title: params ? params.car.name : 'A Nested Details Screen',
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
    //this.props.navigation.state.params.CarsScreen.deleteCar({ carId: 1 });
    this.props.navigation.goBack();
  }

  render() {
    /* 2. Read the params from the navigation state */
    const params = this.props.navigation.state.params;
    const car = params ? params.car : null;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Details Screen</Text>
        <Text>car: {JSON.stringify(car)}</Text>
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
    console.log("AddScreen Add")
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
          containerStyle={{ position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.props.navigation.goBack() : this.addCar()}
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

  searchCar = () => {
    //this.props.navigation.state.params.CarsScreen.searchCars({ carId: 1 });
    console.log("SerachScreen Search");
    this.props.navigation.goBack();
  }

  render() {
    const component1 = () => <Text style={{ color: '#007aff', fontSize: 16 }}>Back</Text>
    const component2 = () => <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 16 }}>Search</Text>
    const buttons = [{ element: component1 }, { element: component2 }]
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ScrollView>
          <Text>Search Screen</Text>
        </ScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.props.navigation.goBack() : this.searchCar()}
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