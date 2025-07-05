let classifier
let nectarLevel = 0
let nectarTarget = 0
let soundDetected = false

let jarX, jarY, jarWidth, jarHeight
let bubbles = []

function setup() {
	let canvas = createCanvas(400, 600)
	canvas.parent('sketch-holder')

	classifier = ml5.soundClassifier('SpeechCommands18w', modelReady)

	jarX = width / 2 - 80
	jarY = height / 2 - 100
	jarWidth = 160
	jarHeight = 200

	for (let i = 0; i < 25; i++) {
		bubbles.push(new Bubble())
	}
}

function modelReady() {
	console.log('Sound classifier ready')
	classifier.classify(gotResult)
}

function gotResult(error, results) {
	if (error) {
		console.error(error)
		return
	}
	soundDetected = results[0].confidence > 0.75
}

function draw() {
	background('#FFEFF4')

	// Soft glow behind jar
	noStroke()
	fill(255, 240, 255, 50)
	ellipse(width / 2, jarY + jarHeight / 2, jarWidth + 40, jarHeight + 30)

	// Update nectar level
	if (soundDetected) {
		nectarTarget += 2
	} else {
		nectarTarget -= 0.5
	}
	nectarTarget = constrain(nectarTarget, 0, jarHeight - 10)
	nectarLevel = lerp(nectarLevel, nectarTarget, 0.1)

	drawNectar(nectarLevel)
	maskJarBottom() // mask anything below jar
	drawJar()

	// Bubbles inside nectar
	for (let bubble of bubbles) {
		if (
			bubble.y < jarY + jarHeight &&
			bubble.y > jarY + jarHeight - nectarLevel
		) {
			bubble.update()
			bubble.display()
		}
	}
}

// Draw nectar that hugs jar and disappears when too small
function drawNectar(level) {
	if (level < 5) return

	noStroke()
	fill('#FFD1A4')

	let cx = width / 2
	let bottomY = jarY + jarHeight - 4
	let topY = bottomY - level

	beginShape()
	vertex(cx - 60, bottomY) // left base
	bezierVertex(cx - 70, bottomY - 30, cx - 70, topY + 30, cx - 45, topY)
	vertex(cx + 45, topY)
	bezierVertex(cx + 70, topY + 30, cx + 70, bottomY - 30, cx + 60, bottomY)
	bezierVertex(cx + 50, bottomY + 6, cx - 50, bottomY + 6, cx - 60, bottomY)
	endShape(CLOSE)

	// Nectar surface glow
	if (level > 12) {
		fill('#FFF1D0')
		ellipse(cx, topY + 1, 60, 14)
	}
}

// Draw jar with closed bottom and highlights
function drawJar() {
	noFill()
	stroke(0)
	strokeWeight(3)

	let cx = width / 2
	let topY = jarY
	let bottomY = jarY + jarHeight

	beginShape()
	vertex(cx - 60, bottomY)
	bezierVertex(cx - 80, bottomY - 40, cx - 80, topY + 40, cx - 50, topY)
	vertex(cx + 50, topY)
	bezierVertex(cx + 80, topY + 40, cx + 80, bottomY - 40, cx + 60, bottomY)
	bezierVertex(cx + 50, bottomY + 10, cx - 50, bottomY + 10, cx - 60, bottomY)
	endShape(CLOSE)

	// Top opening
	fill('#FFEFF4')
	stroke(0)
	strokeWeight(2)
	ellipse(cx, topY, 100, 24)

	// Lid
	// Thicker Lid
	fill('#B3E4C7')
	stroke(0)
	strokeWeight(2)
	rect(cx - 55, topY - 20, 110, 16, 6)

	// Apricot label (handwritten diagonal tape)
	push()
	translate(width / 2, jarY + jarHeight / 2) // Center of jar
	rotate(radians(-15)) // Diagonal tilt

	// Tape background
	fill('#FFFFFF') // Soft cream tape color
	stroke(0)
	strokeWeight(1.2)
	rectMode(CENTER)
	rect(0, 0, 90, 28, 6) // Centered rounded tape

	// Handwritten text
	textAlign(CENTER, CENTER)
	textSize(14)
	textFont('Comic Sans MS')
	fill('#333')
	noStroke()
	text('~*Apricot*~', 0, 1)

	pop()

	pop()

	// Highlight
	noStroke()
	fill(255, 255, 255, 30)
	beginShape()
	vertex(cx - 40, topY + 10)
	bezierVertex(cx - 60, topY + 80, cx - 60, bottomY - 80, cx - 40, bottomY - 10)
	bezierVertex(cx - 35, bottomY - 80, cx - 35, topY + 80, cx - 40, topY + 10)
	endShape(CLOSE)

	fill(255, 255, 255, 40)
	ellipse(cx, topY + 8, 80, 12)
}

// Mask bottom nectar overflow (visual cleanup)
function maskJarBottom() {
	let cx = width / 2
	let bottomY = jarY + jarHeight

	noStroke()
	fill('#FFEFF4')
	beginShape()
	vertex(cx - 64, bottomY - 2)
	bezierVertex(
		cx - 45,
		bottomY + 12,
		cx + 45,
		bottomY + 12,
		cx + 64,
		bottomY - 2
	)
	vertex(cx + 64, height)
	vertex(cx - 64, height)
	endShape(CLOSE)
}

// Bubble class with pastel color and motion
class Bubble {
	constructor() {
		this.reset()
	}

	reset() {
		this.x = random(width / 2 - 50, width / 2 + 50)
		this.y = jarY + jarHeight
		this.size = random(6, 12)
		this.speed = random(0.4, 1.2)
		this.color = random(['#FFD6EC', '#CDEFFF', '#FFF0D6', '#D7FFEF', '#F0D6FF'])
	}

	update() {
		this.y -= this.speed
		if (this.y < jarY + jarHeight - nectarLevel - 10) {
			this.reset()
		}
	}

	display() {
		noStroke()
		let c = color(this.color)
		c.setAlpha(80)
		fill(c)
		ellipse(this.x, this.y, this.size)
	}
}
