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

	let domain = site.match(/http[s]?:\/\/[^\/]*/)[0]
	console.log("domain:", domain, "for:", site)

	let response,
		html,
		emails = []

	try {
		emails = []
		response = await fetch(site)
		html = await response.text()
	} catch (error) {
		console.error("Error while fetching:", site)
		return []
	}

	//console.log(html)

	emails = emails.concat(findEmails(html))
	let otherSites = findLinks(html)
	otherSites = otherSites.map((i) => {
		if (i[0] == "/") return domain + i
		else if (/http[s]?:\/\//.test(i)) return i
		else return domain + "/" + i
	})

	console.log("links", otherSites)

	if (level - 1) {
		let promises = []
		for (let i = 0; i < otherSites.length && i < 10; i++)
			promises.push(search(otherSites[i], level - 1))

		Promise.all(promises).then((values) => {
			console.log(values)

			for (let i of values) {
				console.log(i)
				emails = emails.concat(i)
				console.log(emails)
			}

			if (res) respondWithEmails(emails, res)
			return emails
		})
	} else {
		respondWithEmails(emails, res)
		return emails
	}
}

function respondWithEmails(emails, res = null) {
	if (!res) return

	emails = uniq(emails)
	console.log("emails", emails)
	res.write("emails: " + emails)
	res.end()
}

function findEmails(str) {
	return [...str.matchAll(/\w+\@\w+\.\w+/g)].map((i) => i[0])
}
function findLinks(str) {
	let links = [...str.matchAll(/<a\shref=\"[^#"\.][^\"]+/g)]
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
