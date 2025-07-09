let video
let poseNet
let poses = []

let trails = {}
let currentShape = {}
let lastPos = {}
let watering = {}

let loading = true
let fadeOpacity = 255
let showDebug = true

let lastMovementTime = 0
let trailOpacity = 255
let isInactive = false

let wateringTime = 1200

function setup() {
	let canvas = createCanvas(windowWidth, windowHeight)
	canvas.position(0, 0)
	canvas.style('z-index', '1')

	video = createCapture(VIDEO, () => {
		console.log('📷 Video started')
	})
	video.size(width, height)
	video.hide()

	poseNet = ml5.poseNet(video, () => {
		console.log('✅ PoseNet loaded')
		loading = false
	})

	poseNet.on('pose', (results) => {
		poses = results
	})

	noFill()
}

function draw() {
	push()
	tint(255, 100)
	image(video, 0, 0, width, height)
	pop()

	background(255, 255, 255, 10) // subtle white fade

	if (loading) {
		drawLoadingScreen()
		return
	}

	drawPosePetals()

	// Inactivity dimming
	let inactivity = millis() - lastMovementTime
	if (inactivity > 4000) {
		trailOpacity = max(0, trailOpacity - 3)
		isInactive = true
	} else {
		trailOpacity = min(255, trailOpacity + 15)
		isInactive = false
	}

	// Fade overlay
	if (fadeOpacity > 0) {
		fill(255, 229, 236, fadeOpacity)
		rect(0, 0, width, height)
		fadeOpacity -= 5
	}

	// Debug
	if (showDebug) {
		fill(100, 100)
		noStroke()
		textSize(14)
		textAlign(RIGHT, BOTTOM)
		text('👁️ Debug: D to toggle', width - 10, height - 10)
		text(`Inactive: ${isInactive ? 'YES' : 'NO'}`, width - 10, height - 30)
		text(`Trail Opacity: ${Math.round(trailOpacity)}`, width - 10, height - 50)
	}
}

function drawLoadingScreen() {
	fill('#ffe5ec')
	rect(0, 0, width, height)

	push()
	textAlign(CENTER, CENTER)
	textFont('Cherry Bomb One')
	textSize(48)
	fill('#d6336c')
	text('Loading...', width / 2, height / 2)
	pop()
}

function drawPosePetals() {
	if (poses.length > 0) {
		let keypoints = poses[0].pose.keypoints

		for (let kp of keypoints) {
			if (kp.score > 0.5) {
				let name = kp.part
				let x = kp.position.x
				let y = kp.position.y

				detectMotionBurst(name, x, y)
				addTrail(name, x, y, currentShape[name] || 'classic')
				lastMovementTime = millis()

				if (showDebug) {
					fill(0)
					noStroke()
					ellipse(x, y, 8)
					text(name, x + 8, y)
				}
			}
		}
	}

	// Draw trails with wrist-specific palettes
	for (let part in trails) {
		let isLeft = part.toLowerCase().includes('left')
		let isRight = part.toLowerCase().includes('right')

		let strokeCol, startFill, endFill, agedStart, agedEnd

		if (isLeft) {
			strokeCol = color('#CBA6F7') // lavender
			startFill = color('#EBD5FF')
			endFill = color('#CBA6F7')
			agedStart = color('#8B7BB8')
			agedEnd = color('#D4AF37')
		} else if (isRight) {
			strokeCol = color('#FFB6C1') // pastel pink
			startFill = color('#FFE0EC')
			endFill = color('#FFB6C1')
			agedStart = color('#F08080')
			agedEnd = color('#D4AF37')
		} else {
			strokeCol = color(0)
			startFill = color('#FFD6F5')
			endFill = color('#FEC8D8')
			agedStart = color('#999')
			agedEnd = color('#777')
		}

		drawFlowerTrail(
			trails[part],
			strokeCol,
			startFill,
			endFill,
			agedStart,
			agedEnd,
			part
		)

		const maxAge = 1000
		trails[part] = trails[part].filter((p) => millis() - p.t < maxAge)
	}
}

function detectMotionBurst(part, x, y) {
	const burstThreshold = 40
	const waterThreshold = 30

	let prev = lastPos[part]

	if (prev) {
		let dx = x - prev.x
		let dy = y - prev.y
		let speed = dist(x, y, prev.x, prev.y)

		if (speed > burstThreshold) {
			let shapes = ['classic', 'tulip', 'star']
			currentShape[part] = random(shapes)
			console.log(`🌼 ${part} burst → ${currentShape[part]}`)
		}

		if (dy > waterThreshold) {
			watering[part] = millis()
			console.log(`💧 ${part} watered!`)
		}
	}

	lastPos[part] = { x, y }
}

function addTrail(part, x, y, shape) {
	if (!trails[part]) trails[part] = []
	trails[part].push({ x, y, t: millis(), shape })
	if (trails[part].length > 50) trails[part].shift()
}

function drawFlowerTrail(
	trail,
	strokeCol,
	startFill,
	endFill,
	agedStartFill,
	agedEndFill,
	part
) {
	for (let i = 0; i < trail.length; i++) {
		let pos = trail[i]
		let age = millis() - pos.t

		let now = millis()
		let isWatered = watering[part] && now - watering[part] < wateringTime

		let size = map(age, 0, 1000, isWatered ? 64 : 48, isWatered ? 28 : 20)
		let alpha = map(age, 0, 1000, 200, 0)
		alpha = min(alpha, trailOpacity)

		let amt = constrain(map(age, 0, 1000, 0, 1), 0, 1)
		let currentStartFill = isInactive ? agedStartFill : startFill
		let currentEndFill = isInactive ? agedEndFill : endFill
		let fillCol = lerpColor(currentStartFill, currentEndFill, amt)
		fillCol.setAlpha(alpha)

		push()
		translate(pos.x, pos.y)
		rotate((sin(millis() / 200 + i) * PI) / 6)

		drawingContext.shadowBlur = isWatered ? 12 : 6
		drawingContext.shadowColor = strokeCol

		stroke(0) // 🖤 Black outlines
		strokeWeight(2)
		fill(fillCol)

		drawPetal(size, pos.shape)

		if (isWatered) {
			noStroke()
			fill(255, 200)
			for (let s = 0; s < 2; s++) {
				let angle = random(TWO_PI)
				let r = random(4, 10)
				ellipse(cos(angle) * r, sin(angle) * r, 2)
			}
		}

		pop()
	}
}

function drawPetal(size, shape) {
	switch (shape) {
		case 'tulip':
			beginShape()
			vertex(0, 0)
			bezierVertex(-size, -size * 0.8, -size * 0.5, size, 0, size)
			bezierVertex(size * 0.5, size, size, -size * 0.8, 0, 0)
			endShape(CLOSE)
			break

		case 'star':
			beginShape()
			for (let i = 0; i < 5; i++) {
				let angle = (TWO_PI * i) / 5
				let x = cos(angle) * size
				let y = sin(angle) * size
				vertex(x, y)
				angle += PI / 5
				x = cos(angle) * size * 0.5
				y = sin(angle) * size * 0.5
				vertex(x, y)
			}
			endShape(CLOSE)
			break

		case 'classic':
		default:
			beginShape()
			vertex(0, 0)
			bezierVertex(-size * 0.8, -size * 1.2, -size * 0.8, size * 0.5, 0, size)
			bezierVertex(size * 0.8, size * 0.5, size * 0.8, -size * 1.2, 0, 0)
			endShape(CLOSE)
			break
	}
}

function keyPressed() {
	if (key === 'd' || key === 'D') {
		showDebug = !showDebug
		console.log('👁️ Debug mode:', showDebug ? 'ON' : 'OFF')
	}
}
