'''
/*
 * Kelvin temperature sensor using a DS18b20 1-wire sensor
 */
 '''

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from AWSIoTPythonSDK.exception.AWSIoTExceptions import connectTimeoutException, publishTimeoutException
import logging
import time
import argparse
import json
from w1thermsensor import W1ThermSensor, SensorNotReadyError
from retrying import retry

parser = argparse.ArgumentParser()
parser.add_argument("-e", "--endpoint", action="store", required=True, dest="host", help="Your AWS IoT custom endpoint")
parser.add_argument("-r", "--rootCA", action="store", required=True, dest="rootCAPath", help="Root CA file path")
parser.add_argument("-c", "--cert", action="store", dest="certificatePath", help="Certificate file path")
parser.add_argument("-k", "--key", action="store", dest="privateKeyPath", help="Private key file path")
parser.add_argument("-p", "--port", action="store", dest="port", type=int, default=8883, help="Port number override")
parser.add_argument("-id", "--clientId", action="store", dest="clientId", default="basicPubSub", help="Targeted client id")
parser.add_argument("-t", "--topic", action="store", dest="topic", default="sdk/test/Python", help="Targeted topic")

args = parser.parse_args()
host = args.host
rootCAPath = args.rootCAPath
certificatePath = args.certificatePath
privateKeyPath = args.privateKeyPath
port = args.port
clientId = args.clientId
topic = args.topic

# Configure logging
logger = logging.getLogger("AWSIoTPythonSDK.core")
logger.setLevel(logging.INFO)
streamHandler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

# Init AWSIoTMQTTClient
myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId)
myAWSIoTMQTTClient.configureEndpoint(host, port)
myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

# AWSIoTMQTTClient connection configuration
myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)  # 5 sec

@retry(wait_exponential_multiplier=1000, wait_exponential_max=10000)
def connect_to_broker_with_retries():
    # Connect and subscribe to AWS IoT
    print("Connecting to broker with retries...")
    try:
        myAWSIoTMQTTClient.connect()
    except connectTimeoutException:
        print("Failed to connect, will retry.")
        raise


connect_to_broker_with_retries()

# need to sleep before moving on
time.sleep(2)

# Publish to the same topic in a loop forever
sensor = W1ThermSensor()
temperature = 0
while True:
    timestamp = int(time.time())

    try:
        temperature = int(10 * sensor.get_temperature())
        print("Sensor %s has temperature %.2f" % (sensor.id, temperature))

        message = {"timestamp": timestamp, "temperature": temperature}
        messageJson = json.dumps(message)
        myAWSIoTMQTTClient.publish(topic, messageJson, 1)
        print('Published topic %s: %s\n' % (topic, messageJson))
    except SensorNotReadyError:
        print("Sensor %s is not ready to read")
    except publishTimeoutException:
        print("Timedout trying to publish")

    # This will be our polling frequency, once every 30s
    time.sleep(30)
