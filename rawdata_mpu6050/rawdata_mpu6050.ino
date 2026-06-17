#include <Wire.h>

const int MPU = 0x68;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  Wire.beginTransmission(MPU); // bắt đầu nói chuyện với thanh ghi có địa chỉ 0x68
  Wire.write(0x6B); // địa chỉ mặc định của MPU6050
  Wire.write(0); // để tắt chế bit Sleep mặc định của MPU6050
  Wire.endTransmission();

  delay(1000);
  Serial.println("Sẵn sàng đọc dữ liệu");
}

void loop() {
  Wire.beginTransmission(MPU);
  Wire.write(0x3B); // thanh ghi chứa 8 bit cao của trục X gia tốc
  Wire.endTransmission(false); // Repeat Start, ngăn các thiết bị khác chen ngang quá trình đọc
  Wire.requestFrom(MPU, 14, true); // đẩy ra 14 byte dữ liệu liên tiếp

  // Bước 1: Đọc và ép về kiểu số nguyên 16-bit có dấu
  int16_t ax_raw = (Wire.read() << 8 | Wire.read());
  int16_t ay_raw = (Wire.read() << 8 | Wire.read());
  int16_t az_raw = (Wire.read() << 8 | Wire.read());

  Wire.read(); Wire.read(); // Bỏ qua nhiệt độ

  int16_t gx_raw = (Wire.read() << 8 | Wire.read());
  int16_t gy_raw = (Wire.read() << 8 | Wire.read());
  int16_t gz_raw = (Wire.read() << 8 | Wire.read());

  // Bước 2: Chia cho hệ số để ra giá trị thực (float)
  float ax = ax_raw / 16384.0;
  float ay = ay_raw / 16384.0;
  float az = az_raw / 16384.0;

  float gx = gx_raw / 131.0;
  float gy = gy_raw / 131.0;
  float gz = gz_raw / 131.0;
  
  Serial.print("Accel: "); Serial.print(ax); Serial.print("  |");
  Serial.print(ay); Serial.print("  |");
  Serial.println(az); 

  Serial.print("Gyro: "); Serial.print(gx); Serial.print("  |");
  Serial.print(gy); Serial.print("  |");
  Serial.println(gz); 
  delay(20);
}
