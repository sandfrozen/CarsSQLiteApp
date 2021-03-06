import React from 'react';
import { View, Text, Button, Easing, Animated, ScrollView, ListView, Alert, AlertIOS, StyleSheet, TextInput, KeyboardAvoidingView, Picker } from 'react-native';
import { StackNavigator } from 'react-navigation';
import { Icon, ButtonGroup } from 'react-native-elements'
import { List, ListItem, Tile } from 'react-native-elements'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const SQLite = require('react-native-sqlite-storage');
const db = SQLite.openDatabase("carsDB.db");

const iosBlue = 'rgb(0, 122, 255)'
const iosRed = 'rgb(255, 59, 48)'
const buttonsHeight = 40

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
      headerTitle: (
        <Text style={styles.nav} onPress={params.reloadData}>{(params && params.counter ?  "Cars: " + params.counter : "Cars")}</Text>
      ),
      // headerBackTitle: 'Cars',
    }
  };

  componentWillMount() {
    this.sqlCreateTable();
    this.props.navigation.setParams({ reloadData: this._reloadData });
  }
  _reloadData = () => {
    this.sqlSelectAllCars();
  };

  goToSearch = () => {
    this.props.navigation.navigate('Search', {
      CarsScreen: this,
    })
  }

  goToAdd = () => {
    this.props.navigation.navigate('Add', {
      CarsScreen: this,
    })
  }

  async sqlCreateTable() {
    await db.transaction((tx) => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS `Cars` (`id` INTEGER, `name` TEXT, `model`	TEXT, `color`	TEXT, `doors`	INTEGER, `year`	INTEGER, `km`	INTEGER, `price`	REAL, PRIMARY KEY(`id`) );');
    })
    this.sqlSelectAllCars();
  }

  async sqlDeleteAll() {
    await db.transaction((tx) => {
      tx.executeSql('DELETE FROM Cars;');
    })
    this.sqlSelectAllCars();
  }

  async sqlSelectAllCars() {
    db.transaction((tx) => {
      tx.executeSql('SELECT * FROM Cars;', [], (tx, results) => {
        let temp = []
        let len = results.rows.length
        for (let i = 0; i < len; i++) {
          temp.push(results.rows.item(i))
        }
        this.setState({
          carList: this.state.carList.cloneWithRows(temp),
        })
        this.props.navigation.setParams({ counter: this.state.carList.getRowCount() });
      })
    })
  }

  async sqlSelectAllCarsWithCon({ query: query }) {
    console.log(query)

    db.transaction((tx) => {
      tx.executeSql(query, [], (tx, results) => {
        let temp = []
        let len = results.rows.length
        for (let i = 0; i < len; i++) {
          temp.push(results.rows.item(i))
        }
        this.setState({
          carList: this.state.carList.cloneWithRows(temp),
        })
        this.props.navigation.setParams({ counter: this.state.carList.getRowCount() });
        AlertIOS.alert(
          'Founded ' + this.state.carList.getRowCount() + " cars.",
          '',
          [
            { text: 'OK', style: 'cancel' },
          ],
        )

      })
    })
  }

  askDeleteAll() {
    AlertIOS.alert(
      'Delete cars?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'YES', onPress: () => this.sqlDeleteAll(), style: 'destructive' },
      ],
    )
  }

  renderRow(rowData, sectionID) {
    let price = ""
    try {
      price = rowData.price ? (rowData.price).toFixed(2) + " PLN" : 'No Price';
    } catch (e) {
      price = 'No Price';
    }

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
    const component1 = () => <Icon name='delete-sweep' type='material-icons' color={iosRed} />
    const component2 = () => <Icon name='search' type='material-icons' color={iosBlue} />
    const component3 = () => <Icon name='add' type='material-icons' color={iosBlue} />
    const buttons = [{ element: component1 }, { element: component2 }, { element: component3 }]
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ScrollView style={{ width: "100%", marginBottom: buttonsHeight }}>
          <List>
            <ListView
              dataSource={this.state.carList}
              renderRow={this.renderRow}
              enableEmptySections={true}
            />
          </List>
        </ScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ height: buttonsHeight, position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => {
            if (index == 0) {
              this.askDeleteAll()
            } else if (index == 1) {
              this.goToSearch()
            } else {
              this.goToAdd()
            }
          }}
        />
      </View>
    );
  }
}

class DetailsScreen extends React.Component {
  constructor(props) {
    super(props);

    const params = this.props.navigation.state.params;
    this.state = {
      car: params && params.car ? params.car : null,
    };
  }

  static navigationOptions = ({ navigation }) => {
    let params = navigation.state.params;

    return {
      title: params && params.car ? params.car.name + ' ' + params.car.model : 'Car info',
      headerLeft: null,
    }
  }

  componentWillMount() {
    this.props.navigation.setParams({ _deleteCar: this.askDeleteCar });

    let params = this.props.navigation.state.params;
    // let car = JSON.parse(JSON.stringify(params.car)) // same as below
    let car = params.car
    this.setState({
      car: params && params.car ? car : null,
      DetailsScreen: this
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
    AlertIOS.alert(
      'Delete car?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'YES', onPress: () => this.deleteCar(), style: 'destructive' },
      ],
    )
  }

  deleteCar = () => {
    this.sqlDeleteCar({ carId: this.state.car.id });
    this.props.navigation.state.params.CarsScreen.sqlSelectAllCars();
    this.props.navigation.goBack();
  }

  render() {
    const component1 = () => <Icon name='keyboard-return' type='material-icons' color={iosBlue} />
    const component2 = () => <Icon name='delete-forever' type='material-icons' color={iosRed} />
    const component3 = () => <Icon name='edit' type='font-awesome' color={iosBlue} />

    const buttons = [{ element: component1 }, { element: component2 }, { element: component3 }]
    /* 2. Read the params from the navigation state */
    const car = this.state.car;

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View>
            <Text style={styles.text}>Color: {car.color}</Text>
            <Text style={styles.text}>Doors: {car.doors}</Text>
            <Text style={styles.text}>Year: {car.year} r.</Text>
            <Text style={styles.text}>Kilometers: {car.km} km</Text>
            <Text style={styles.text}>Price: {car.price} PLN</Text>
          </View>
        </ScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ height: buttonsHeight, position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => {
            if (index == 0) {
              this.props.navigation.state.params.CarsScreen.sqlSelectAllCars();
              this.props.navigation.goBack()
            } else if (index == 1) {
              this.askDeleteCar()
            } else {
              this.props.navigation.navigate('Edit', {
                car: car,
                DetailsScreen: this,
              })
            }
          }}
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
        name: "Test",
        model: "Test",
        color: 'Test',

        doors: 2,
        year: 2003,
        km: 4000,

        price: 5000,
      }
    }
    this.focusNextField = this.focusNextField.bind(this);
    this.inputs = {};
  }

  focusNextField(id) {
    this.inputs[id].focus();
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: 'New Car',
      headerLeft: null,
    }
  };

  insertCar() {
    let car = this.state.car;
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
    const component1 = () => <Icon name='keyboard-return' type='material-icons' color={iosBlue} />
    const component2 = () => <Icon name='save' type='material-icons' color={iosRed} />
    const buttons = [{ element: component1 }, { element: component2 }]

    const car = this.state.car;
    return (
      <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
        <KeyboardAwareScrollView scrollEnabled={true}>
          <ScrollView>
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Brand Name:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      car.name = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['1'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('2');
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Model:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      car.model = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['2'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('3');
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Color:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      car.color = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['3'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('4');
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Doors:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      car.doors = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['4'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('5');
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Year:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      car.year = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['5'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('6');
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>km:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      car.km = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['6'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('7');
                    }}
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Price:</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={(text) => {
                    car.price = text;
                    this.setState({ car: car })
                  }}
                  ref={input => {
                    this.inputs['7'] = input;
                  }}
                  returnKeyType={"done"}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAwareScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ height: buttonsHeight, position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.props.navigation.goBack() : this.addCar()}
        />
      </View>

    );
  }
}

class EditScreen extends React.Component {
  constructor(props) {
    super(props);

    const params = this.props.navigation.state.params;
    this.state = {
      car: params ? params.car : null,
    }

    this.focusNextField = this.focusNextField.bind(this);
    this.inputs = {};
  }

  focusNextField(id) {
    this.inputs[id].focus();
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: params && params.car ? 'Edit: ' + params.car.name + ' ' + params.car.model : 'Edit Car',
      headerLeft: null,
    }
  }

  async sqlUpdateCar() {
    let car = this.state.car;
    db.transaction((tx) => {
      tx.executeSql('UPDATE Cars SET name=$0, model=$1, color=$2, doors=$3, year=$4, km=$5, price=$6 WHERE id=$7;', [car.name, car.model, car.color, car.doors, car.year, car.km, car.price, car.id])
    })
  }

  saveChanges() {
    this.sqlUpdateCar();
    this.props.navigation.state.params.DetailsScreen.setState({ car: this.state.car })
    this.props.navigation.state.params.DetailsScreen.props.navigation.setParams({ car: this.state.car });
    this.props.navigation.goBack();
  }

  render() {
    const component1 = () => <Icon name='keyboard-return' type='material-icons' color={iosBlue} />
    const component2 = () => <Icon name='save' type='material-icons' color={iosRed} />
    const buttons = [{ element: component1 }, { element: component2 }]

    const car = this.state.car;
    return (
      <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
        <KeyboardAwareScrollView scrollEnabled={true}>
          <ScrollView>
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Brand Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={car.name}
                    onChangeText={(text) => {
                      car.name = text;
                      this.setState({ car: car })
                      this.props.navigation.setParams({ car: car });
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['1'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('2');
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Model:</Text>
                  <TextInput
                    style={styles.input}
                    value={car.model}
                    onChangeText={(text) => {
                      car.model = text;
                      this.setState({ car: car })
                      this.props.navigation.setParams({ car: car });
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['2'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('3');
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Color:</Text>
                  <TextInput
                    style={styles.input}
                    value={car.color}
                    onChangeText={(text) => {
                      car.color = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['3'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('4');
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Doors:</Text>
                  <TextInput
                    style={styles.input}
                    value={(car.doors).toString()}
                    onChangeText={(text) => {
                      car.doors = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['4'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('5');
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Year:</Text>
                  <TextInput
                    style={styles.input}
                    value={car.year.toString()}
                    onChangeText={(text) => {
                      car.year = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['5'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('6');
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>km:</Text>
                  <TextInput
                    style={styles.input}
                    value={car.km.toString()}
                    onChangeText={(text) => {
                      car.km = text;
                      this.setState({ car: car })
                    }}
                    blurOnSubmit={false}
                    returnKeyType={"next"}
                    ref={input => {
                      this.inputs['6'] = input;
                    }}
                    onSubmitEditing={() => {
                      this.focusNextField('7');
                    }}
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Price:</Text>
                <TextInput
                  style={styles.input}
                  value={car.price.toString()}
                  onChangeText={(text) => {
                    car.price = text;
                    this.setState({ car: car })
                  }}
                  returnKeyType={"done"}
                  ref={input => {
                    this.inputs['7'] = input;
                  }}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAwareScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ height: buttonsHeight, position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => index == 0 ? this.props.navigation.goBack() : this.saveChanges()}
        />
      </View>

    );
  }
}

class SerachScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      model: "",
      color: "",

      doorsMin: 1,
      doorsMax: 7,
      yearMin: 1990,
      yearMax: 2018,
      kmMin: 0,
      kmMax: 999999,
      priceMin: 0,
      priceMax: 999999,
    }
  }

  static navigationOptions = ({ navigation }) => {
    const params = navigation.state.params;

    return {
      title: 'Search',
      headerLeft: null,
    }
  };

  searchCar = () => {

    let query = 'SELECT * FROM Cars WHERE name LIKE \'%' + this.state.name + '%\' AND model LIKE \'%' + this.state.model + '%\' AND color LIKE \'%' + this.state.color + '%\''

    query = query + ' AND doors>=' + this.state.doorsMin + ' AND doors<=' + this.state.doorsMax;
    query = query + ' AND year>=' + this.state.yearMin + ' AND year<=' + this.state.yearMax;
    query = query + ' AND km>=' + this.state.kmMin + ' AND km<=' + this.state.kmMax;
    query = query + ' AND price>=' + this.state.priceMin + ' AND price<=' + this.state.priceMax;

    query = query + ';'

    this.props.navigation.state.params.CarsScreen.sqlSelectAllCarsWithCon({ query: query });
    this.props.navigation.goBack()
  }

  selectAll() {
    this.props.navigation.state.params.CarsScreen.sqlSelectAllCars()
    this.props.navigation.goBack()
  }

  render() {
    const component1 = () => <Icon name='keyboard-return' type='material-icons' color={iosBlue} />
    const component2 = () => <Icon name='all-inclusive' type='material-icons' color={iosBlue} />
    const component3 = () => <Icon name='search' type='material-icons' color={iosBlue} />
    const buttons = [{ element: component1 }, { element: component2 }, { element: component3 }]
    return (
      <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
        <KeyboardAwareScrollView scrollEnabled={true}>
          <ScrollView>
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Brand Name like</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      this.setState({ name: text })
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Model like</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      this.setState({ model: text })
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Color like</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={(text) => {
                      this.setState({ color: text })
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Doors min</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.doorsMin.toString()}
                    onChangeText={(text) => {
                      this.setState({ doorsMin: text })
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Doors max</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.doorsMax.toString()}
                    onChangeText={(text) => {
                      this.setState({ doorsMax: text })
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Year min</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.yearMin.toString()}
                    onChangeText={(text) => {
                      this.setState({ yearMin: text })
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Year max</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.yearMax.toString()}
                    onChangeText={(text) => {
                      this.setState({ yearMax: text })
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>km min</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.kmMin.toString()}
                    onChangeText={(text) => {
                      this.setState({ kmMin: text })
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>km max</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.kmMax.toString()}
                    onChangeText={(text) => {
                      this.setState({ kmMax: text })
                    }}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Price min</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.priceMin.toString()}
                    onChangeText={(text) => {
                      this.setState({ priceMin: text })
                    }}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Price max</Text>
                  <TextInput
                    style={styles.input}
                    value={this.state.priceMax.toString()}
                    onChangeText={(text) => {
                      this.setState({ priceMax: text })
                    }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAwareScrollView>
        <ButtonGroup
          buttons={buttons}
          containerStyle={{ height: buttonsHeight, position: 'absolute', left: 0, right: 0, bottom: 0, marginLeft: 0, marginBottom: 0, marginRight: 0, marginTop: 0 }}
          onPress={(index) => {
            if (index == 0) {
              this.props.navigation.goBack()
            } else if (index == 1) {
              this.selectAll()
            } else {
              this.searchCar()
            }
          }}
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
    Edit: {
      screen: EditScreen,
    },
    Search: {
      screen: SerachScreen,
    },
  },
  {
    initialRouteName: 'Cars',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
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
  },
  input: {
    height: 30,
    backgroundColor: 'white',
    borderColor: 'lightgray',
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  label: {
    paddingTop: 16,
    marginLeft: 1,
    color: 'gray',
    fontSize: 12,
  },
  text: {
    backgroundColor: 'whitesmoke',
    color: '#4A90E2',
    fontSize: 24,
    padding: 10,
  },
  row: {
    paddingVertical: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  col: {
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  nav: {
    fontSize: 17,
    color: 'black',
    fontWeight: '800',
  }
});