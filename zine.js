const { jsPDF } = window.jspdf
let zine

class Zine {
  /*****************
   *
   *****************/
  constructor (type = 'single_page', dpi = 300, paper = '11x8.5', filetype = 'image/png', vAlign = 'center' ) {
    const parts = paper.split('x')
    const x = parts[0]
    const y = parts[1]

    console.log(`Created new ${paper} ${type} zine @ ${dpi}`)

    this.paper = paper
    this.dpi = dpi
    this.filetype = filetype
    this.ext = this.filetype === 'image/jpeg' ? 'jpg' : 'png'
    this.name = document.getElementById('filename').value
    this.vAlign = vAlign

    if (this.name === '') {
      this.name = 'zine'
    }

    this.type = type

    this.x = parseFloat(x) * dpi
    this.y = parseFloat(y) * dpi


    if (this.type === 'single_page') {
      this.xPage = this.x / 4
      this.yPage = this.y / 2
    } else {
      this.xPage = this.x / 2
      this.yPage = this.y
    }

    this.canvas = document.createElement('canvas')
    this.canvas.width  = this.x
    this.canvas.height = this.y

    this.ctx = this.canvas.getContext('2d')
    this.ctx.scale(1, 1)
    this.ctx.fillStyle = 'white'
    this.ctx.fillRect(0, 0, this.x, this.y)

    this.sheets = []
    this.image = null

    this.positions = {
      'single_page' : [
        { x : 3, y : 1 }, //1 - Front
        { x : -4, y : -1, flip : true }, //2
        { x : -3, y : -1, flip : true }, //3
        { x : -2, y : -1, flip : true }, //4
        { x : -1, y : -1, flip : true }, //5
        { x : 0, y : 1 }, //6
        { x : 1, y : 1 }, //7
        { x : 2, y : 1 } //8 - Back
      ],
      'half_page' : [
        [
          { x : 0, y : 0 },
          { x : 1, y : 0 }
        ],
        [
          { x : -2, y : -1, flip : true },
          { x : -1, y : -1, flip : true }
        ]
      ]
    }

    this.layoutPages()
  }
  /*****************
   *
   *****************/
  layoutPages () {
    const pagesElement = document.getElementById('pages')
    const actionElement = document.getElementById('action')
    const pages = this.type === 'single_page' ? 8 : 4
    const div = document.createElement('div')
    const build = document.createElement('button')
    const download = document.createElement('button')
    const pdf = document.createElement('button')
    const add = document.createElement('button')
    const br = document.createElement('br')

    pagesElement.innerHTML = ''
    actionElement.innerHTML = ''

    if (this.type === 'half_page') {
      add.innerText = 'Add Page'
      add.onclick = this.addPage.bind(this)
      actionElement.appendChild(add)
    }

    build.innerText = 'Build Zine'
    build.onclick = this.build.bind(this)
    actionElement.appendChild(build)

    download.innerText = `Download Zine [${this.ext.toUpperCase()}]`
    download.onclick = this.download.bind(this)
    pdf.innerText = 'Download Zine [PDF]'
    pdf.onclick = this.downloadPDF.bind(this)

    actionElement.appendChild(download)
    actionElement.appendChild(pdf)
    pagesElement.appendChild(div)

    for (let i = 0; i < pages; i++) {
      this.layoutPage(i)
    }       

  }
  /*****************
   *
   *****************/
  addPage () {
    let pos = this.countPages()
    this.layoutPage(pos)
  }
  /*****************
   *
   *****************/
  layoutPage (i) {
    const el = document.createElement('input')
    const div = document.createElement('div')
    const label = document.createElement('label')
    const pages = document.getElementById('pages')

    div.classList.add('field-row')

    el.setAttribute('type', 'file')
    el.setAttribute('id', `page_${i}`)
    el.setAttribute('accept', 'image/x-png,image/jpeg');

    if (i === 0 && this.type === 'single_page') {
      label.innerText = 'Front'
    } else if (i === 7 && this.type === 'single_page') {
      label.innerText = 'Back'
    } else {
      label.innerText = `${i + 1}`
    }
    
    div.appendChild(label)
    div.appendChild(el)
    
    pages.appendChild(div)
  }
  /*****************
   *
   *****************/
  countPages () {
    return document.querySelectorAll('input[type=file]').length
  }
  /*****************
   *
   *****************/
  async waitForImgLoad (img) {
    return new Promise((resolve, reject) => {
      img.onload = function() { 
        return resolve()
      }
    })
  }
  /*****************
   *
   *****************/
  async build (forPdf = false) {
    const sheetsEl = document.getElementById('sheets')
    const br = document.createElement('br')
    let totalPages = this.countPages()
    let pages = this.type === 'single_page' ? 8 : 4
    let sheets = this.type === 'single_page' ? 1 : 1
    let cont
    let page
    let input
    let url
    let img
    let count = 0
    let pageAll = []
    let pageMap = []
    let halfPage = 0
    let link
    let side = 0
    let imgAwaiter
    let sheetData

    if (this.type === 'half_page') {
      totalPages = Math.round(Math.ceil(totalPages / 4) * 4)
      sheets = Math.round(totalPages / 4) * 2 //front and back
    }

    console.log(`sheets: ${sheets}`)
    sheetsEl.innerHTML = ''
    this.sheets = []

    if (this.type === 'single_page') {
      for (let i = 0; i < pages; i++) {
        console.log(`page_${count}`)
        input = document.getElementById(`page_${count}`)
        count++
        if (input) {
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
              await this.drawOnCanvas(this.positions[this.type][i], url)
            } catch (err) {
              throw err
            }
          }
        }
      }
      link = document.createElement('button')
      img = document.createElement('img')

      this.image = this.canvas.toDataURL(this.filetype)

      if (forPdf) {
        sheetData = this.canvas.toDataURL('image/jpeg', 0.99) //png too large for pdf
        this.sheets.push(sheetData)
      }

      imgAwaiter = this.waitForImgLoad(img)
      img.id = `img_0`
      img.src = this.image
      link.onclick = function () { downloadPage(`img_0`) }
      link.innerText = `Download page 0`

      sheetsEl.appendChild(link)
      sheetsEl.appendChild(br)
      sheetsEl.appendChild(img)

      await imgAwaiter

    } else if (this.type === 'half_page') {
      for (let i = 0; i < totalPages; i++) {
        pageAll.push(i)
      }

      for (let i = 0; i < totalPages; i++) {
        if (halfPage === 1 || halfPage === 3) {
          pageAll.reverse()
        }
        pageMap.push(pageAll.pop())
        halfPage++
        if (halfPage > 3) {
          halfPage = 0
        }
      }
      for (let x = 0; x < sheets; x++) {
        //reset to white
        this.ctx.fillRect(0, 0, this.x, this.y)
        side = x % 2 
        for (let i = 0; i < pages / 2; i++) {
          console.log(`page_${pageMap[count]}`)
          input = document.getElementById(`page_${pageMap[count]}`)
          count++
          if (input) {
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
                await this.drawOnCanvas(this.positions[this.type][side][i], url)
              } catch (err) {
                throw err
              }
            }
          }
        }
        link = document.createElement('button')
        img = document.createElement('img')

        this.image = this.canvas.toDataURL(this.filetype)

        if (forPdf) {
          sheetData = this.canvas.toDataURL('image/jpeg', 0.99) //png too large for pdf
          this.sheets.push(sheetData)
        }

        imgAwaiter = this.waitForImgLoad(img)
        img.id = `img_${x}`
        img.src = this.image
        link.onclick = function () { downloadPage(`img_${x}`) }
        link.innerText = `Download page ${x}`

        sheetsEl.appendChild(link)
        sheetsEl.appendChild(br)
        sheetsEl.appendChild(img)

        await imgAwaiter
      }
    }

    //draw lines

    this.name = document.getElementById('filename').value

    if (this.name === '') {
      this.name = 'zine'
    }
  }

  /*****************
   *
   *****************/
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

    image = this.canvas.toDataURL(this.type)

    link.download = `${this.name}_${this.type}_${this.paper}_${this.dpi}dpi.${this.ext}`

    link.href = image
    link.click()
  }

  /*****************
   *
   *****************/
  async downloadPDF () {
    const options = {
      orientation : 'landscape',
      unit : 'px',
      format : [this.x, this.y]
    }
    const link = document.createElement('a')
    const pdf = new jsPDF(options)
    const elements = document.querySelectorAll('#sheets img')
    const type = this.ext === 'jpg' ? 'JPEG' : 'PNG'
    let datauri
    let imgData

    try {
      await this.build(true)
    } catch (err) {
      console.error(err)
      alert(`Error building zine`)
      return false
    }

    for (let i = 0; i < this.sheets.length; i++) {
      imgData = this.sheets[i]
      if (i > 0) {
        pdf.addPage([this.x, this.y], 'landscape')
      }
      pdf.addImage(imgData, type, 0, 0, this.x, this.y)
    }

    this.sheets = []

    datauri = pdf.output('datauristring')
    link.download = `${this.name}_${this.type}_${this.paper}_${this.dpi}dpi.pdf`
    link.href = datauri

    link.click()
  }

  /*****************
   *
   *****************/
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

  /*****************
   *
   *****************/
  async drawOnCanvas (position, url) {
    return new Promise ((resolve, reject) => {
      const img = new Image
      let xRatio
      let yRatio
      let ratio
      let hCompare
      let yOffset = 0
      
      img.onload = (function (e) {
        if (position.flip) {
          this.ctx.save()
          this.ctx.rotate(Math.PI)
        }
        
        //this.ctx.drawImage(img, position.x * this.xPage, position.y * this.yPage)
        xRatio = this.xPage / img.width
        yRatio = this.yPage / img.height
        ratio  = Math.min ( xRatio, yRatio )

        if (this.vAlign === 'center') {
          hCompare = (ratio * img.height)
          if (hCompare < this.yPage) {
            yOffset = Math.round((this.yPage - hCompare) / 2)
          }
        } else if (this.vAlign === 'top') {
          yOffset = 0
        } else if (this.vAlign === 'bottom') {
          hCompare = (ratio * img.height)
          if (hCompare < this.yPage) {
            yOffset = Math.round(this.yPage - hCompare)
          }
        }

        this.ctx.drawImage(img, 0, 0, img.width, img.height, 
          position.x * this.xPage, (position.y * this.yPage) + yOffset, img.width * ratio, img.height * ratio )

        if (position.flip) {
          this.ctx.restore()
        }

        return resolve(true)
      }).bind(this)

      img.src = url
    })
  }
}

/*****************
 *
 *****************/
function template (type = 'single_page', dpi = 300, paper = '11x8.5', filetype = 'image/png') {
  const x = paper.split('x')[0]
  const y = paper.split('x')[1]
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const link = document.createElement('a')
  const ext = filetype === 'image/jpeg' ? 'jpg' : 'png'
  let width
  let height
  let image

  if (type === 'single_page') {
    width = parseFloat(x) * dpi / 4
    height = parseFloat(y) * dpi / 2
  } else {
    width = parseFloat(x) * dpi / 2
    height = parseFloat(y) * dpi
  }

  canvas.width  = width
  canvas.height = height

  ctx.scale(1, 1)
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  image = canvas.toDataURL(filetype)

  link.download = `zine_page_template_${paper}_${dpi}dpi.${ext}`
  link.href = image
  link.click()
}

/*****************
 *
 *****************/
function downloadTemplate () {
  const eType = document.getElementById('type')
  const eDpi = document.getElementById('dpi')
  const ePaper = document.getElementById('paper')
  const eFiletype = document.getElementById('filetype')
  const type = eType.options[eType.selectedIndex].value
  const dpi = eDpi.options[eDpi.selectedIndex].value
  const paper = ePaper.options[ePaper.selectedIndex].value
  const filetype = eFiletype.options[eFiletype.selectedIndex].value

  template(type, dpi, paper, filetype)
}

/*****************
 *
 *****************/
function downloadPage (id) {
  const img = document.getElementById(id)
  const link = document.createElement('a')

  url = img.src

  link.download = `${zine.name}_${zine.type}_${zine.paper}_${zine.dpi}dpi_${id}.${zine.ext}`
  link.href = url
  link.click()
}

/*****************
 *
 *****************/
function createFileList (file) {
  const fileList = new FileList()
  fileList[0] = file
  fileList.item = index => fileList[index]
  return fileList
}

/*****************
 *
 *****************/
function dragndrop () {
  const dropArea = document.getElementById('zinemaker')

  function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  })

  ;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })

  dropArea.addEventListener('drop', handleDrop, false)

  function highlight(e) {
    dropArea.classList.add('highlight')
  }

  function unhighlight(e) {
    dropArea.classList.remove('highlight')
  }

  function handleDrop(e) {
    const dt = e.dataTransfer
    const files = dt.files
    unhighlight()
    handleFiles(files)
  }

  function handleFiles (files) {
    const fileNames = []
    let cont = false
    let file
    let len
    let count = 0
    let currentPages
    let input
    let page
    let dataTransfer
    for (let file of files) {
      fileNames.push(file.name)
    }
    
    fileNames.sort()

    len = files.length

    console.log(`files: ${len}`)

    if (!zine) {
      main()
    }

    if (len > 8 && zine.type === 'single_page') {
      cont = confirm(`You've included ${len} pages for an 8 page mini zine, continue?`)
      if (!cont) {
        return false
      }
    }

    currentPages = zine.countPages()

    for (let i = 0; i < currentPages.length; i++) {
      input = document.getElementById(`page_${count}`)
      if (input) {
        page = input.value
        if (page === null || page === '') {
          //empty
        } else {
          count = i + 1
        }
      }

    }
    for (let name of fileNames) {
      file = [...files].find( el => el.name === name)
      
      input = document.getElementById(`page_${count}`)

      if (!input && zine.type === 'half_page') {
        zine.addPage(count)
        input = document.getElementById(`page_${count}`)
      }

      if (input) {
        dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
      }

      count++
    }
  }
}

/*****************
 *
 *****************/
function main () {
  const eType = document.getElementById('type')
  const eDpi = document.getElementById('dpi')
  const ePaper = document.getElementById('paper')
  const eFiletype = document.getElementById('filetype')
  const eVAlign = document.getElementById('valign')
  const type = eType.options[eType.selectedIndex].value
  const dpi = eDpi.options[eDpi.selectedIndex].value
  const paper = ePaper.options[ePaper.selectedIndex].value
  const filetype = eFiletype.options[eFiletype.selectedIndex].value
  const vAlign = eVAlign.options[eVAlign.selectedIndex].value

  zine = new Zine(type, dpi, paper, filetype, vAlign)
}

(function () {
  dragndrop()
})()
