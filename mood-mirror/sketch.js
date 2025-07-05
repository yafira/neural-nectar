// Global variables
let sentiment
let currentMood = 'waiting'
let moodText = ''
let moodColor
let nectar = []
let time = 0
let showResult = false
let resultText = ''
let confidence = 0
let modelReady = false

function setup() {
	let canvas = createCanvas(
		min(windowWidth * 0.9, 500),
		min(windowHeight * 0.5, 350)
	)
	canvas.parent('sketch-holder')
	moodColor = color(255, 192, 203)

	if (typeof ml5 !== 'undefined') {
		sentiment = ml5.sentiment('movieReviews', modelLoaded)
	}

	setTimeout(() => {
		if (!modelReady) {
			alert('Still loading the model... try refreshing the page.')
		}
	}, 10000)

	document
		.getElementById('textInput')
		.addEventListener('keypress', function (e) {
			if (e.key === 'Enter' && modelReady) {
				analyzeMood()
			}
		})
}

function modelLoaded() {
	modelReady = true
	document.getElementById('analyzeBtn').disabled = false
	document.getElementById('analyzeBtn').textContent = '🔮 Reveal My Mood'
	document.getElementById('loadingStatus').style.display = 'none'
}

function draw() {
	drawPastelBackground()
	updateNectar()
	drawMirrorFrame()
	drawMoodDisplay()
	time += 0.03
}

function drawPastelBackground() {
	for (let i = 0; i <= height; i++) {
		let inter = map(i, 0, height, 0, 1)
		let topColor = color(252, 239, 249)
		let bottomColor = lerpColor(topColor, moodColor, 0.2)
		let c = lerpColor(topColor, bottomColor, inter)
		stroke(c)
		line(0, i, width, i)
	}
}

function drawMirrorFrame() {
	push()
	translate(width / 2, height / 2)

	stroke(255, 255, 255, 120)
	strokeWeight(6)
	fill(255, 255, 255, 30)
	ellipse(0, 0, 280, 280)

	let shimmerAlpha = map(sin(time * 2), -1, 1, 50, 120)
	let shimmerGray = color(200, 200, 200, shimmerAlpha)
	noStroke()
	fill(shimmerGray)
	ellipse(0, 0, 240, 240)

	stroke(red(moodColor), green(moodColor), blue(moodColor), 80)
	strokeWeight(2)
	noFill()
	ellipse(0, 0, 260, 260)

	pop()
}

function drawMoodDisplay() {
	push()
	translate(width / 2, height / 2)

	let shimmerCount = 60
	for (let i = 0; i < shimmerCount; i++) {
		let angle = TWO_PI * (i / shimmerCount) + time * 0.2
		let r1 = 140 + sin(i * 0.5 + time * 2) * 3
		let x = cos(angle) * r1
		let y = sin(angle) * r1
		stroke(255, 255, 255, 40)
		strokeWeight(2)
		point(x, y)
	}

	noFill()
	stroke(255, 255, 255, 40)
	strokeWeight(1)
	for (let y = -60; y <= 60; y += 10) {
		beginShape()
		for (let x = -60; x <= 60; x += 10) {
			let wave = sin(x * 0.2 + time * 2 + y * 0.05) * 4
			vertex(x, y + wave)
		}
		endShape()
	}

	if (showResult) {
		let float = sin(time * 2) * 5

		// Optional: soft white glow
		fill(255, 255, 255, 100)
		noStroke()
		ellipse(0, -20 + float, 90, 90)

		// Emoji
		textAlign(CENTER, CENTER)
		textSize(70)
		fill('#4b4b4b') // dark gray for contrast
		noStroke()
		text(getMoodEmoji(currentMood), 0, -20 + float)

		// Mood description
		fill(100)
		textSize(18)
		text(moodText, 0, 70)

		// Score
		fill(120)
		textSize(12)
		text(`Sentiment: ${(confidence * 100).toFixed(0)}% positive`, 0, 90)

		// Short input
		fill(140)
		textSize(10)
		let shortText =
			resultText.length > 30 ? resultText.substring(0, 30) + '...' : resultText
		text(`"${shortText}"`, 0, 110)
	}
	pop()
}

function updateNectar() {
	for (let i = nectar.length - 1; i >= 0; i--) {
		let drop = nectar[i]
		drop.y += drop.speed
		drop.x += sin(drop.y * 0.01) * 0.5
		drop.alpha -= 2

		push()
		fill(red(drop.color), green(drop.color), blue(drop.color), drop.alpha)
		noStroke()
		ellipse(drop.x, drop.y, drop.size)
		ellipse(drop.x, drop.y - drop.size / 3, drop.size * 0.7)
		fill(255, drop.alpha * 0.6)
		ellipse(drop.x - drop.size / 4, drop.y - drop.size / 4, drop.size / 4)
		pop()

		if (drop.alpha <= 0 || drop.y > height + 20) {
			nectar.splice(i, 1)
		}
	}
}

function createNectar(color) {
	for (let i = 0; i < 6; i++) {
		nectar.push({
			x: width / 2 + random(-60, 60),
			y: height / 2 + random(-30, 30),
			speed: random(1, 3),
			size: random(8, 14),
			alpha: 200,
			color: color,
		})
	}
}

function analyzeMood() {
	if (!modelReady) {
		alert('Model is still loading, please wait a moment! ⏳')
		return
	}
	let text = document.getElementById('textInput').value.trim()
	if (text === '') {
		alert('Please enter some text first! ✨')
		return
	}

	let lowerText = text.toLowerCase()
	resultText = text

	// 1. Manual overrides for better accuracy
	if (
		lowerText.includes('depressed') ||
		lowerText.includes('hopeless') ||
		lowerText.includes('unhappy') ||
		lowerText.includes('worthless') ||
		lowerText.includes('miserable') ||
		lowerText.includes('alone') ||
		lowerText.includes("i'm not okay") ||
		lowerText.includes("i'm not happy") ||
		lowerText.includes('i feel sad')
	) {
		currentMood = 'sad'
		moodText = 'Gentle Sadness'
		moodColor = color('#ADD8E6')
		confidence = 0.2
		showResult = true
		createNectar(moodColor)
		return
	} else if (
		lowerText.includes('confused') ||
		lowerText.includes('uncertain') ||
		lowerText.includes('unsure') ||
		lowerText.includes('lost')
	) {
		currentMood = 'confused'
		moodText = 'Foggy Thoughts'
		moodColor = color('#E0BBE4')
		confidence = 0.3
		showResult = true
		createNectar(moodColor)
		return
	} else if (
		lowerText.includes('anxious') ||
		lowerText.includes('worried') ||
		lowerText.includes('nervous') ||
		lowerText.includes('panic') ||
		lowerText.includes('scared')
	) {
		currentMood = 'anxious'
		moodText = 'Fluttering Nerves'
		moodColor = color('#FFB6B9')
		confidence = 0.3
		showResult = true
		createNectar(moodColor)
		return
	}

	// 2. Fallback to ML model
	let prediction = sentiment.predict(text)
	let score = prediction.score
	confidence = score

	if (
		lowerText.includes('love') ||
		lowerText.includes('romantic') ||
		lowerText.includes('crush')
	) {
		currentMood = 'romantic'
		moodText = 'Romantic Whispers'
		moodColor = color('#FFC0CB')
	} else if (
		lowerText.includes('hate') ||
		lowerText.includes('angry') ||
		lowerText.includes('mad')
	) {
		currentMood = 'angry'
		moodText = 'Fiery Feelings'
		moodColor = color('#FF6B6B')
	} else if (
		lowerText.includes('sick') ||
		lowerText.includes('ill') ||
		lowerText.includes('vomit') ||
		lowerText.includes('nauseous')
	) {
		currentMood = 'sick'
		moodText = 'Feeling Unwell'
		moodColor = color('#A8D5BA')
	} else if (
		lowerText.includes('tired') ||
		lowerText.includes('exhausted') ||
		lowerText.includes('drained') ||
		lowerText.includes('fatigued')
	) {
		currentMood = 'tired'
		moodText = 'Tired Energy'
		moodColor = color('#CFC3E8')
	} else if (
		lowerText.includes('sleepy') ||
		lowerText.includes('groggy') ||
		lowerText.includes('drowsy')
	) {
		currentMood = 'sleepy'
		moodText = 'Sleepy Whispers'
		moodColor = color('#DDE6F1')
	} else if (
		lowerText.includes('calm') ||
		lowerText.includes('relaxed') ||
		lowerText.includes('peaceful') ||
		lowerText.includes('chill')
	) {
		currentMood = 'relaxed'
		moodText = 'Tranquil Vibes'
		moodColor = color('#C2F0C2')
	} else if (
		score > 0.6 &&
		(lowerText.includes('like') || lowerText.includes('enjoy'))
	) {
		currentMood = 'joyful'
		moodText = 'Joyful Vibes!'
		moodColor = color('#FFDFBA')
	} else if (score > 0.6) {
		currentMood = 'joyful'
		moodText = 'Positive Energy'
		moodColor = color('#FFDFBA')
	} else if (score < 0.4) {
		currentMood = 'sad'
		moodText = 'Melancholy Mood'
		moodColor = color('#ADD8E6')
	} else {
		currentMood = 'neutral'
		moodText = 'Peaceful Balance'
		moodColor = color('#DDA0DD')
	}

	showResult = true
	createNectar(moodColor)
}

function getMoodEmoji(mood) {
	switch (mood) {
		case 'romantic':
			return '😍'
		case 'angry':
			return '😡'
		case 'sick':
			return '🤢'
		case 'tired':
			return '😓'
		case 'sleepy':
			return '😴'
		case 'relaxed':
			return '🍃'
		case 'confused':
			return '😕'
		case 'anxious':
			return '😰'
		case 'joyful':
			return '😊'
		case 'sad':
			return '😢'
		case 'neutral':
			return '😌'
		default:
			return '🪞'
	}
}

function windowResized() {
	resizeCanvas(min(windowWidth * 0.9, 500), min(windowHeight * 0.5, 350))
}
