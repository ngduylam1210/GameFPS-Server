const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. KẾT NỐI MONGODB ---
const mongoURI = process.env.MONGO_URI; 
mongoose.connect(mongoURI)
  .then(() => console.log('[MongoDB] Da ket noi thanh cong!'))
  .catch(err => console.error('[MongoDB] Loi ket noi:', err));

// Tạo bảng lưu lịch sử chơi game
const sessionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  action: String,
  data: Object
});
const GameSession = mongoose.model('GameSession', sessionSchema);

// --- 2. KẾT NỐI MQTT (HIVEMQ) ---
const mqttHost = process.env.MQTT_HOST; // Phải có dạng mqtts://...:8883
const mqttOptions = {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  protocol: 'mqtts'
};

const client = mqtt.connect(mqttHost, mqttOptions);

client.on('connect', () => {
  console.log('[MQTT] Da ket noi toi HiveMQ Cloud!');
  client.subscribe('darkfantasy/controller', (err) => {
    if (!err) console.log('[MQTT] Da dang ky chu de: gamefps/controller');
  });
});

client.on('message', async (topic, message) => {
  console.log(`[MQTT] Nhan tin nhan tu ${topic}: ${message.toString()}`);
  // Lưu vào Database tự động
  try {
    const payload = JSON.parse(message.toString());
    await GameSession.create({ action: 'CONTROLLER_DATA', data: payload });
  } catch (error) {
    console.log('[MQTT] Tin nhan khong phai JSON hoac loi luu DB');
  }
});

// --- 3. TẠO WEB API CHO DASHBOARD ---
// API Lấy dữ liệu mới nhất
app.get('/api/history', async (req, res) => {
  try {
    const history = await GameSession.find().sort({ timestamp: -1 }).limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Loi truy xuat du lieu' });
  }
});

// API Bắn lệnh OTA ép buộc xuống ESP32
app.post('/api/trigger-ota', (req, res) => {
  client.publish('darkfantasy/command', JSON.stringify({ command: 'START_OTA' }));
  res.json({ message: 'Da gui lenh OTA toi ESP32!' });
});

// --- Khởi động Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] Dang chay tai port ${PORT}`);
});