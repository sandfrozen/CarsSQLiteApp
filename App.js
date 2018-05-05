import React from 'react';
import { View, Text, Button, Easing, Animated, ScrollView, ListView, Alert, AlertIOS, StyleSheet, TextInput, KeyboardAvoidingView } from 'react-native';
import { StackNavigator } from 'react-navigation';
import { Icon, ButtonGroup } from 'react-native-elements'
import { List, ListItem, Tile } from 'react-native-elements'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

let SQLite = require('react-native-sqlite-storage');
let db = SQLite.openDatabase("carsDB.db");

class CarsScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      carList: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    }

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
          color='green'
          onPress={params._goToSearch} />
      ),
      headerTitle: 'Cars',
      headerRight: (
        <Icon
          raised
          name='add'
          type='material-icons'
          color='red'
          onPress={params._goToAdd} />
      ),
      headerBackTitle: 'Cars',
    }
  };

  componentWillMount() {
    this.props.navigation.setParams({ _goToSearch: this.goToSearch })
    this.props.navigation.setParams({ _goToAdd: this.goToAdd })
    this.sqlCreateTable();
  }

  goToSearch = () => {
    this.props.navigation.navigate('Search');
  }

  goToAdd = () => {
    this.props.navigation.navigate('Add', {
      CarsScreen: this,
    })
  }

  async sqlCreateTable() {
    // await db.transaction((tx) => {
    //   tx.executeSql('DELETE FROM Cars;');
    // })
    await db.transaction((tx) => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS `Cars` (`id` INTEGER, `name` TEXT, `model`	TEXT, `color`	TEXT, `doors`	INTEGER, `year`	INTEGER, `km`	INTEGER, `price`	REAL, PRIMARY KEY(`id`) );');
    })
    this.sqlSelectAllCars();
  }

  async sqlSelectAllCars() {
    db.transaction((tx) => {
      tx.executeSql('SELECT * FROM Cars;', [], (tx, results) => {
        console.log("SELECT completed")
        let temp = []
        let len = results.rows.length
        for (let i = 0; i < len; i++) {
          temp.push(results.rows.item(i))
        }
        this.setState({
          carList: this.state.carList.cloneWithRows(temp),
        })
      })
    })
  }

  renderRow(rowData, sectionID) {
    let price = rowData.price ? (rowData.price).toFixed(2) + " PLN" : 'No Price'
    return (
      <ListItem
        leftIcon={{ name: 'directions-car' }}
        title={rowData.name + " " + rowData.model}
        subtitle={rowData.km + " km" + "  /  " + price}
        rightIcon={{ name: 'chevron-right' }}
        onPress={() => {
          /* 1. Navigate to the Details route with params */
          this.props.navigation.navigate('Details', {
            car: rowData,
            CarsScreen: this,
          })
        }}
      />
    )
  }

  render() {
    const component1 = () => <Icon name='delete' type='material-icons' color='darkred' onPress={() => this.goToSearch() } />
    const component2 = () => <Icon name='search' type='material-icons' color='green' onPress={() => this.goToSearch() } />
    const component3 = () => <Icon name='add' type='material-icons' color='red' onPress={() => this.goToSearch() } />
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

    this.state = {
      car: null,
    };
  }

  static navigationOptions = ({ navigation }) => {
    let params = navigation.state.params;

    return {
      title: params && params.car ? params.car.name + ' ' + params.car.model : 'Car info',
      headerRight: (
        <Icon
          raised
          name='delete'
          type='material-icons'
          color='darkred'
          onPress={params._deleteCar} />
      ),
    }
  }

  componentWillMount() {
    this.props.navigation.setParams({ _deleteCar: this.askDeleteCar });

    let params = this.props.navigation.state.params;
    // let car = JSON.parse(JSON.stringify(params.car)) // same as below
    let car = params.car
    this.setState({
      car: params && params.car ? car : null
    })
  }

  async sqlDeleteCar({ carId: id }) {
    if (id != null) {
      db.transaction((tx) => {
        tx.executeSql('DELETE FROM Cars WHERE id=$0;', [id]);
      })
    } else {
      Alert.alert(
        'Can\'t delete car:',
        'id is null',
        { cancelable: false }
      )
    }
  }

  askDeleteCar = () => {
    Alert.alert(
      'Delete Car',
      'Sure ?',
      [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => this.deleteCar() },
      ],
      { cancelable: false }
    )
  }

  deleteCar = () => {
    this.sqlDeleteCar({ carId: this.state.car.id });
    this.props.navigation.state.params.CarsScreen.sqlSelectAllCars();
    this.props.navigation.goBack();
  }

  render() {
    const component1 = () => <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>Delete</Text>
    const component2 = () => <Text style={{ color: '#007aff', fontSize: 16 }}>Cancel</Text>
    const buttons = [{ element: component1 }, { element: component2 }]
    /* 2. Read the params from the navigation state */
    const params = this.props.navigation.state.params;
    const car = params ? params.car : null;

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ScrollView>
          <Text>Details Screen</Text>
          <Text>car: {JSON.stringify(car)}</Text>
        </ScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.askDeleteCar() : this.props.navigation.goBack()}
        />
      </View>
    );
  }
}

class AddScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      car: {
        name: "BMW",
        model: "X7",
        color: 'yellow',

        doors: 4,
        year: 2010,
        km: 39000,

        price: 9900.00,
      }
    }
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: 'New Car',
    }
  };

  insertCar() {
    let car = this.state.car;
    console.log("INSERT: " + JSON.stringify(car))
    db.transaction((tx) => {
      tx.executeSql('INSERT INTO `Cars`(`name`,`model`,`color`,`doors`,`year`,`km`,`price`) VALUES ($0,$1,$2,$3,$4,$5,$6);', [car.name, car.model, car.color, car.doors, car.year, car.km, car.price], (tx, results) => {
        console.log("INSERT completed");
        console.log("Rows Affected: " + results.rowsAffected);
        console.log("Insert ID: " + results.insertId);
      })
    })
  }

  askAddCar() {
    Alert.alert(
      'Save New Car',
      'Sure ?',
      [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'OK', onPress: () => this.addCar() },
      ],
      { cancelable: false }
    )
  }

  addCar = () => {
    this.insertCar();
    this.props.navigation.state.params.CarsScreen.sqlSelectAllCars();
    this.props.navigation.goBack();
  }


  render() {
    const component1 = () => <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
    const component2 = () => <Text style={{ color: '#007aff', fontSize: 16 }}>Cancel</Text>
    const buttons = [{ element: component1 }, { element: component2 }]
    /* 2. Read the params from the navigation state */
    const params = this.props.navigation.state.params;
    const nextId = params ? params.nextId : null;
    const car = this.state.car;
    return (
      <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
        <KeyboardAwareScrollView scrollEnabled={true}>
          <ScrollView>
            <View style={styles.form}>
              <Text>
                Brand Name:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.name = text;
                  this.setState({ car: car })
                }}
              />
              <Text style={styles.label}>
                Model:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.model = text;
                  this.setState({ car: car })
                }}
              />
              <Text style={styles.label}>
                Color:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.color = text;
                  this.setState({ car: car })
                }}
              />
              <Text style={styles.label}>
                Doors:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.doors = text;
                  this.setState({ car: car })
                }}
              />
              <Text style={styles.label}>
                Year:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.year = text;
                  this.setState({ car: car })
                }}
              />
              <Text style={styles.label}>
                km:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.km = text;
                  this.setState({ car: car })
                }}
              />
              <Text style={styles.label}>
                Price:
            </Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => {
                  car.price = text;
                  this.setState({ car: car })
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAwareScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.askAddCar() : this.props.navigation.goBack()}
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
    console.log("SerachScreen Search")
    this.props.navigation.goBack()
  }

  render() {
    const component1 = () => <Text style={{ color: 'green', fontWeight: 'bold', fontSize: 16 }}>Search</Text>
    const component2 = () => <Text style={{ color: '#007aff', fontSize: 16 }}>Back</Text>
    const buttons = [{ element: component1 }, { element: component2 }]
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ScrollView>
          <Text>Search Screen</Text>
        </ScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.searchCar() : this.props.navigation.goBack()}
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

        return { opacity, transform: [{ translateY }] }
      },
    }),
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />
  }
}

const styles = StyleSheet.create({
  form: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 16,
  },
  input: {
    height: 30,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  label: {
    paddingTop: 16,
  },
});