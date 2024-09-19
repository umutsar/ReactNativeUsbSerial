import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Button, Text, PermissionsAndroid, StyleSheet, TouchableOpacity } from 'react-native';
import { UsbSerialManager } from 'react-native-usb-serialport-for-android';

const SerialPortComponent = () => {
    const [receivedData, setReceivedData] = useState();
    const [usbSerialPort, setUsbSerialPort] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [temp, setTemp] = useState(0);
    const [sumVoltage, setSumVoltage] = useState(0);
    const [soc, setSoc] = useState(0);
    const [distanceCovered, setDistanceCovered] = useState(0);
    const [distanceCoveredPrevious, setDistanceCoveredPrevious] = useState(0);
    const [range, setRange] = useState(0);
    const [faults, setFaults] = useState([]);
    const [chargeStatus, setChargeStatus] = useState(0);
    const [dataLength, setDataLength] = useState(0);
    const [firstByte, setFirstByte] = useState(0);
    const [type, setType] = useState('');

    async function requestUSBPermission() {
        try {
            const grantedStorage = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: "External Storage Permission",
                    message: "This app needs access to external storage",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );

            if (grantedStorage !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Storage permission denied');
                return;
            }

            const devices = await UsbSerialManager.list();
            if (devices.length > 0) {
                const grantedUSB = await UsbSerialManager.tryRequestPermission(devices[0].deviceId);

                if (grantedUSB) {
                    Alert.alert('USB permission granted');
                    const port = await UsbSerialManager.open(devices[0].deviceId, {
                        baudRate: 9600,
                        parity: 0,
                        dataBits: 8,
                        stopBits: 1,
                    });
                    setUsbSerialPort(port);
                } else {
                    Alert.alert('USB permission denied');
                }
            } else {
                Alert.alert('No USB devices found');
            }
        } catch (err) {
            console.error('Error requesting permission:', err);
            Alert.alert('Error', 'Permission request failed');
        }
    }

    useEffect(() => {
        let subscription;
        if (usbSerialPort) {
            subscription = usbSerialPort.onReceived((event) => {
                const data = event.data;

                const modifiedData = data.split("FF").filter(part => part.length > 0).map(part => parseInt(part, 16));


                let dataDecimalArray = [];

                switch (modifiedData[0]) {
                    case 0:
                        setSpeed(modifiedData[1]);
                        break;
                    case 1:
                        setTemp(modifiedData[1]);
                        break;
                    case 2:
                        setSumVoltage(modifiedData[1]);
                        break;

                    case 3:
                        setSoc(modifiedData[1]);
                        break;

                    case 4:
                        setDistanceCovered((modifiedData[1] << 8) | modifiedData[2]);
                        break;

                    case 5:
                        setDistanceCoveredPrevious((modifiedData[1] << 8) | modifiedData[2]);
                        break;

                    case 6:
                        setRange((modifiedData[1] << 8) | modifiedData[2]);
                        break;

                    case 7:
                        setFaults([modifiedData[1], modifiedData[2], modifiedData[3], modifiedData[4], modifiedData[5]]);
                        break;

                    case 8:
                        setChargeStatus(modifiedData[1]);
                        break;

                    default:
                        break;
                }
                setFirstByte(modifiedData[0]);
                setDataLength(modifiedData.length);
                for (let i = 0; i < modifiedData.length; i++) {
                    const byte = modifiedData[i];
                    const decimalValue = parseInt(byte);
                    dataDecimalArray.push(byte);
                }

                setReceivedData(modifiedData.join(","));
            });


            return () => {
                console.log("RETURN ICINE GIRDI")
                if (subscription) {
                    subscription.remove();
                }
                usbSerialPort.close();
            };
        }
    }, [usbSerialPort]);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Button onPress={requestUSBPermission} title="Bağlan" color="#007BFF" />
            </View>

            <View style={styles.dataContainer}>
                {/* <Text style={styles.title}>Alınan Veri</Text> */}
                <Text style={styles.data}>{receivedData}</Text>
                <Text style={styles.dataInfo}>Veri Genişliği: {dataLength}</Text>
                <Text style={styles.dataInfo}>İlk Bayt: {firstByte}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hız</Text>
                <Text style={styles.data}>{speed}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sıcaklık</Text>
                <Text style={styles.data}>{temp} °C</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Voltaj</Text>
                <Text style={styles.data}>{sumVoltage} V</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Şarj</Text>
                <Text style={styles.data}>{soc}%</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Şarj Durumu</Text>
                <Text style={styles.data}>{chargeStatus ? "Şarj Oluyor" : "Şarj Olmuyor"}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alınan Mesafe</Text>
                <Text style={styles.data}>{distanceCovered} km</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>En Son Alınan Mesafe</Text>
                <Text style={styles.data}>{distanceCoveredPrevious} km</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Menzil</Text>
                <Text style={styles.data}>{range} km</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Arıza</Text>
                <Text style={styles.data}>
                    {faults[0]}, {faults[1]}, {faults[2]}, {faults[3]}, {faults[4]}
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        marginTop: 16
    },
    header: {
        marginBottom: 20,
    },
    dataContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    data: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    dataInfo: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    section: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007BFF',
        marginBottom: 8,
    },
});


export default SerialPortComponent;
