const mqtt = require('mqtt');
const logger = require('../utils/logger');

let mqttClient = null;
const subscribers = new Map();

async function initializeMQTT() {
  return new Promise((resolve, reject) => {
    const options = {
      clientId: process.env.MQTT_CLIENT_ID || 'smart-building-backend',
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined
    };

    mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883', options);

    mqttClient.on('connect', () => {
      logger.info('MQTT client connected to broker');

      // Subscribe to all relevant topics
      const topics = [
        'hvac/+/status',
        'sensors/+/temperature',
        'sensors/+/humidity',
        'sensors/+/occupancy',
        'equipment/+/control',
        'alerts/+'
      ];

      topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
          if (err) {
            logger.error(`Failed to subscribe to topic ${topic}:`, err);
          } else {
            logger.info(`Subscribed to MQTT topic: ${topic}`);
          }
        });
      });

      resolve(mqttClient);
    });

    mqttClient.on('error', (error) => {
      logger.error('MQTT connection error:', error);
      reject(error);
    });

    mqttClient.on('reconnect', () => {
      logger.info('MQTT client reconnecting...');
    });

    mqttClient.on('close', () => {
      logger.warn('MQTT connection closed');
    });

    mqttClient.on('offline', () => {
      logger.warn('MQTT client offline');
    });

    // Handle incoming messages
    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        logger.debug(`MQTT message received on topic ${topic}:`, payload);

        // Notify all subscribers for this topic
        const topicSubscribers = subscribers.get(topic) || [];
        const wildcardSubscribers = Array.from(subscribers.keys())
          .filter(key => matchTopic(topic, key))
          .flatMap(key => subscribers.get(key) || []);

        [...topicSubscribers, ...wildcardSubscribers].forEach(callback => {
          try {
            callback(topic, payload);
          } catch (error) {
            logger.error('Error in MQTT message callback:', error);
          }
        });

      } catch (error) {
        logger.error(`Failed to parse MQTT message from topic ${topic}:`, error);
      }
    });
  });
}

// Match topic with wildcard support
function matchTopic(topic, pattern) {
  const topicParts = topic.split('/');
  const patternParts = pattern.split('/');

  if (patternParts.includes('#')) {
    const hashIndex = patternParts.indexOf('#');
    return topicParts.slice(0, hashIndex).join('/') === patternParts.slice(0, hashIndex).join('/');
  }

  if (topicParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    return part === '+' || part === topicParts[index];
  });
}

// Publish message to topic
function publish(topic, message, options = {}) {
  if (!mqttClient || !mqttClient.connected) {
    logger.error('MQTT client not connected');
    return Promise.reject(new Error('MQTT client not connected'));
  }

  return new Promise((resolve, reject) => {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    mqttClient.publish(topic, payload, {
      qos: options.qos || 0,
      retain: options.retain || false
    }, (error) => {
      if (error) {
        logger.error(`Failed to publish to topic ${topic}:`, error);
        reject(error);
      } else {
        logger.debug(`Published message to topic ${topic}`);
        resolve();
      }
    });
  });
}

// Subscribe to topic with callback
function subscribe(topic, callback) {
  if (!subscribers.has(topic)) {
    subscribers.set(topic, []);
  }
  subscribers.get(topic).push(callback);

  // Subscribe to topic if not already subscribed
  if (mqttClient && mqttClient.connected) {
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to topic ${topic}:`, err);
      } else {
        logger.info(`Subscribed to MQTT topic: ${topic}`);
      }
    });
  }

  // Return unsubscribe function
  return () => {
    const callbacks = subscribers.get(topic) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    if (callbacks.length === 0) {
      subscribers.delete(topic);
      if (mqttClient && mqttClient.connected) {
        mqttClient.unsubscribe(topic);
      }
    }
  };
}

// Unsubscribe from topic
function unsubscribe(topic) {
  subscribers.delete(topic);
  if (mqttClient && mqttClient.connected) {
    mqttClient.unsubscribe(topic, (err) => {
      if (err) {
        logger.error(`Failed to unsubscribe from topic ${topic}:`, err);
      } else {
        logger.info(`Unsubscribed from MQTT topic: ${topic}`);
      }
    });
  }
}

function isConnected() {
  return mqttClient && mqttClient.connected;
}

module.exports = {
  mqttClient,
  initializeMQTT,
  publish,
  subscribe,
  unsubscribe,
  isConnected
};
