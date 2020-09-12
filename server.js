const http = require("http")
const fs = require("fs")
const url = require("url")
const fetch = require("node-fetch")

const hostname = "127.0.0.1"
const port = 3000

async function search(site, res = null) {
	let emails = []
	let response = await fetch("http://" + site)
	let html = await response.text()
	console.log(html)

	emails = emails.concat(findEmails(html))

	/*
	fetch("http://" + site)
		.then((res) => res.text())
		.then((body) =>
			console.log(
				body +
					"\n\nemails: " +
					findEmails(body) +
					"\n\nlinks: " +
					findLinks(body)
			)
		)*/
	if (res) {
		res.write("emails: " + emails)
		res.end()
	}
	return emails
}

function findEmails(str) {
	return str.match(/\w+\@\w+\.\w+/)
}
function findLinks(str) {
	let links = str.match(/<a\shref=\"[^\"]+/)
	return links.map((i) => (i = i.substr(9)))
}

function findWebsites(str) {}

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
			let site = q.query.website
			res.writeHead(200, { "Content-Type": "text/plain" })
			search(site, res)

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
