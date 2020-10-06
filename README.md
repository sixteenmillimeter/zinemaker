# zinemaker

Small webapp for zine pagination.

#### [Demo](https://sixteenmillimeter.github.io/zinemaker/) [Github Pages]

`zinemaker` is a script for making simple 8 page 1 sheet zines, or arbitrary length half-sheet zines. It's designed and built as a static webapp with no backend.

Don't trust me? That's cool. You shouldn't. I'm just some person online. If you want to download and audit the code and then run it offline in some browser on a machine that's not connected to the internet; I encourage you.

* Clone this repo `git clone https://github.com/sixteenmillimeter/zinemaker.git`

or

* [Download this repo]()

or

* [Download this page](./index.html)
* [Download the javascript](./zine.js) (Save in same folder as index.html)
* [Download the css](./zine.css) (Same)
* Run it in private 🥰


For half-page zines, combine all images into a pdf file using [ImageMagick](https://imagemagick.org/index.php).

```bash
convert "*.{png,jpg,jpeg}" -quality 100 outfile.pdf
```
