const http = require("http")
const fs = require("fs")
var url = require("url")

const hostname = "127.0.0.1"
const port = 3000

function search(req) {
	let site = req.query.website
	return "erw"
}

const server = http.createServer((req, res) => {
	var q = url.parse(req.url, true)
	console.log(q.pathname)

	switch (url.parse(req.url, true).pathname) {
		case "/":
			fs.readFile("./index.html", function (err, data) {
				if (err) console.error(err)
				res.writeHead(200, { "Content-Type": "text/html" })
				res.write(data)
				res.end()
			})
			break

		case "/search":
			res.writeHead(200, { "Content-Type": "text/javascript" })
			res.write(search(url.parse(req.url, true)))
			res.end()

		/*
		default:
			res.writeHead(200, { "Content-Type": "text/plain" })
			res.write("no such path")
			res.end()*/
	}
})

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`)
})
