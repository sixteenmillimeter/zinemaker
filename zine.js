class Zine {
	constructor (type = 'single_page', dpi = 300, paper = '11x8.5') {
		const x = paper.split('x')[0]
		const y = paper.split('x')[1]

		console.log(`Created new ${paper} zine @ ${dpi}`)

		this.paper = paper
		this.dpi = dpi
		this.name = document.getElementById('filename').value

		if (this.name === '') {
			this.name = 'zine'
		}

		this.type = type

		this.x = parseFloat(x) * dpi
		this.y = parseFloat(y) * dpi

		this.xPage = this.x / 4
		this.yPage = this.y / 2

		this.canvas = document.createElement('canvas')
		this.canvas.width  = this.x
		this.canvas.height = this.y

		this.ctx = this.canvas.getContext('2d')
		this.ctx.scale(1, 1)
		this.ctx.fillStyle = 'white'
		this.ctx.fillRect(0, 0, this.x, this.y)

		this.pages = []

		this.positions = [
			{ x : 3, y : 1 }, //1 - Front
			{ x : -4, y : -1, flip : true }, //2
			{ x : -3, y : -1, flip : true }, //3
			{ x : -2, y : -1, flip : true }, //4
			{ x : -1, y : -1, flip : true }, //5
			{ x : 0, y : 1 }, //6
			{ x : 1, y : 1 }, //7
			{ x : 2, y : 1 } //8 - Back
		]

		this.layoutPages()
	}
	layoutPages () {
		const pagesElement = document.getElementById('pages')
		const pages = this.type === 'single_page' ? 8 : 0
		const div = document.createElement('div')
		const button = document.createElement('button')

		pagesElement.innerHTML = ''
		button.innerText = 'Download Zine'
		button.onclick = this.download.bind(this)

		for (let i = 0; i < pages; i++) {
			this.layoutPage(i)
		}
		div.appendChild(button)

		pagesElement.appendChild(div)
	}
	layoutPage (i) {
		const el = document.createElement('input')
		const div = document.createElement('div')
		const label = document.createElement('b')
		const pages = document.getElementById('pages')

		el.setAttribute('type', 'file')
		el.setAttribute('id', `page_${i}`)
		el.setAttribute('accept', 'image/x-png,image/jpeg');

		if (i === 0) {
			label.innerText = 'Front'
		} else if (i === 7) {
			label.innerText = 'Back'
		} else {
			label.innerText = `${i + 1}`
		}
		
		div.appendChild(label)
		div.appendChild(el)
		
		pages.appendChild(div)
	}
	async build () {
		const pages = this.type === 'single_page' ? 8 : 0
		let cont
		let page
		let input
		let url
		for (let i = 0; i < pages; i++) {
			input = document.getElementById(`page_${i}`)
			page = input.value
			if (page === null || page === '') {
				if (typeof cont === 'undefined') {
					cont = confirm(`Detected blank pages. Continue to build zine?`)
					if (!cont) {
						throw new Error('Blank pages, cancelling build')
					}
				}
				continue
			} else {
				try {
					url = await this.readFileAsURL(input)
				} catch (err) {
					throw err
				}
				try {
					await this.drawOnCanvas(this.positions[i], url)
				} catch (err) {
					throw err
				}
			}
		}

		//draw lines

		this.name = document.getElementById('filename').value

		if (this.name === '') {
			this.name = 'zine'
		}

	}
	async download () {
		const link = document.createElement('a')
		let image

		try {
			await this.build()
		} catch (err) {
			console.error(err)
			alert(`Error building zine`)
			return false
		}

		image = this.canvas.toDataURL('image/jpg')

		link.download = `${this.name}_${this.paper}_${this.dpi}dpi.jpg`
		link.target = '_blank'
		link.href = image
		link.click()
	}

	async readFileAsURL (input) {
		return new Promise ((resolve, reject) => {
			let reader
			if (input.files && input.files[0]) {
				reader = new FileReader()
				reader.onload = function (e) {
					return resolve(e.target.result)
				}
				reader.readAsDataURL(input.files[0])
			} else {
				return reject(new Error('No input data found'))
			}
		})
	}

	async drawOnCanvas (position, url) {
		return new Promise ((resolve, reject) => {
			const img = new Image
			let xRatio
			let yRatio
			let ratio
			
			img.onload = (function (e) {
				if (position.flip) {
					this.ctx.save()
					this.ctx.rotate(Math.PI)
				}
				
				//this.ctx.drawImage(img, position.x * this.xPage, position.y * this.yPage)
				xRatio = this.xPage / img.width
				yRatio = this.yPage / img.height
				ratio  = Math.min ( xRatio, yRatio )

				this.ctx.drawImage(img, 0, 0, img.width, img.height, 
					position.x * this.xPage, position.y * this.yPage, img.width * ratio, img.height * ratio )

				if (position.flip) {
					this.ctx.restore()
				}

				return resolve(true)
			}).bind(this)

			img.src = url
		})
	}
}

function template (dpi = 300, paper = '11x8.5') {
	const x = paper.split('x')[0]
	const y = paper.split('x')[1]
	const width = parseFloat(x) * dpi / 4
	const height = parseFloat(y) * dpi / 2
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	const link = document.createElement('a')
	let image

	canvas.width  = width
	canvas.height = height

	ctx.scale(1, 1)
	ctx.fillStyle = 'white'
	ctx.fillRect(0, 0, canvas.width, canvas.height)

  	image = canvas.toDataURL('image/jpg')

	link.download = `zine_page_template_${paper}_${dpi}dpi.jpg`
	link.href = image
	link.click()
}

function downloadTemplate () {
	const eDpi = document.getElementById('dpi')
	const ePaper = document.getElementById('paper')
	const dpi = eDpi.options[eDpi.selectedIndex].value
	const paper = ePaper.options[ePaper.selectedIndex].value

	template(dpi, paper)
}

let zine

function main () {
	const eDpi = document.getElementById('dpi')
	const ePaper = document.getElementById('paper')
	const dpi = eDpi.options[eDpi.selectedIndex].value
	const paper = ePaper.options[ePaper.selectedIndex].value

	zine = new Zine('single_page', dpi, paper)
}