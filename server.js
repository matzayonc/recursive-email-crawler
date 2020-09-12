const http = require("http")
const fs = require("fs")
const url = require("url")
const fetch = require("node-fetch")

const hostname = "127.0.0.1"
const port = 3000

const searchLevel = 3

function uniq(a) {
	return a.sort().filter(function (item, pos, ary) {
		return !pos || item != ary[pos - 1]
	})
}

async function search(site, level = levels, res = null) {
	if (!site) return []
	console.log("start search in", site)

	if (!/http[s]?:\/\//.test(site)) site = "http://" + site

	let emails = []
	let response = await fetch(site)
	let html = await response.text()
	//console.log(html)
	let domain = site.match(/http[s]?:\/\/[^\/]*/)[0]

	emails = emails.concat(findEmails(html))
	let otherSites = findLinks(html)
	otherSites = otherSites.map((i) => {
		if (i[0] == "/") return domain + i
		else return i
	})

	console.log("links", otherSites)

	if (level - 1)
		for (let i = 0; i < otherSites.length && i < 10; i++) {
			let newEmails = await search(otherSites[i], level - 1)
			if (newEmails) emails = emails.concat(newEmails)
		}

	if (res) {
		emails = uniq(emails)
		console.log("emails", emails)
		res.write("emails: " + emails)
		res.end()
	}

	return emails
}

function findEmails(str) {
	return [...str.matchAll(/\w+\@\w+\.\w+/g)].map((i) => i[0])
}
function findLinks(str) {
	let links = [...str.matchAll(/<a\shref=\"[^#"][^\"]+/g)]
	//console.log(links)
	return links.map((i) => (i = i[0].substr(9)))
}

function findWebsites(str) {}

const server = http.createServer((req, res) => {
	var q = url.parse(req.url, true)
	//console.log(q.pathname)

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
			search(site, searchLevel, res)
	}
})

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`)
})
