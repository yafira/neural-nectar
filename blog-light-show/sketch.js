let serial;
let sensorValues = [0, 0]; // A0, A1
let writer;
let isConnected = false;

const sensorThreshold = 300; // adjust based on your agar blob sensitivity

async function setup() {
	const canvas = createCanvas(400, 160);
	canvas.parent('canvas-container');
	textAlign(CENTER, CENTER);
	textSize(16);

	serial = navigator.serial;
	document.getElementById('connect').addEventListener('click', connectSerial);
}

function draw() {
	background(240);

	if (!isConnected) {
		text('click "connect" to begin', width / 2, height / 2);
		return;
	}

	for (let i = 0; i < 2; i++) {
		text(`Blob ${i + 1}: ${sensorValues[i]}`, width / 2, 40 + i * 30);
	}

	if (sensorValues[0] > sensorThreshold) {
		sendToArduino('blob1');
	} else if (sensorValues[1] > sensorThreshold) {
		sendToArduino('blob2');
	} else {
		sendToArduino('none');
	}
}

async function connectSerial() {
	const port = await navigator.serial.requestPort();
	await port.open({ baudRate: 9600 });

	const decoder = new TextDecoderStream();
	port.readable.pipeTo(decoder.writable);
	const reader = decoder.readable.getReader();

	const encoder = new TextEncoderStream();
	encoder.readable.pipeTo(port.writable);
	writer = encoder.writable.getWriter();

	isConnected = true;
	console.log('✅ Serial connected');

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		if (value && value.includes(',')) {
			const vals = value
				.trim()
				.split(',')
				.map((v) => parseInt(v));
			if (vals.length >= 2 && vals.every((v) => !isNaN(v))) {
				sensorValues = vals.slice(0, 2); // only keep first 2
			}
		}
	}
}

function sendToArduino(label) {
	if (writer) {
		writer.write(new TextEncoder().encode(label + '\n'));
	}
}
