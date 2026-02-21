String input;

void setup() {
  Serial.begin(9600);
  pinMode(2, OUTPUT); // LED
}

void loop() {
  int val0 = analogRead(A0);
  Serial.println(val0); // send just the A0 value

  if (Serial.available()) {
    input = Serial.readStringUntil('\n');
    input.trim();

    if (input == "on") {
      digitalWrite(2, HIGH); // turn LED on
    } else {
      digitalWrite(2, LOW); // turn LED off
    }
  }

  delay(50); // avoid flooding serial
}
