const http = require("http")
const fs = require("fs")
const url = require("url")
const fetch = require("node-fetch")

const hostname = "127.0.0.1"
const port = 3000

const searchLevel = 4
const amountOfChildren = 10

function uniq(a) {
	return a.sort().filter(function (item, pos, ary) {
		return !pos || item != ary[pos - 1]
	})
}

async function search(site, level = levels, res = null) {
	if (!site) return s
	console.log("start search in", site)

	if (!/http[s]?:\/\//.test(site)) site = "http://" + site
	let s = { emails: [], sites: [] }
	s.sites.push(site)
	if (!site) return s

	let domain = site.match(/http[s]?:\/\/[^\/]*/)[0]

	let response, html

	try {
		response = await fetch(site)
		html = await response.text()
	} catch (err) {
		console.error("Error while fetching:", site, ":", err)
		return s
	}

	s.emails = s.emails.concat(findEmails(html))
	let otherSites = findLinks(html)
	otherSites = otherSites.map((i) => {
		if (i[0] == "/") return domain + i
		else if (/http[s]?:\/\//.test(i)) return i
		else return domain + "/" + i
	})

	if (level - 1 > 0 && otherSites) {
		let promises = []
		for (let i = 0; i < otherSites.length && i < amountOfChildren; i++)
			promises.push(search(otherSites[i], level - 1))

		return await Promise.all(promises).then((values) => {
			console.log("Values:", values)

			for (let i of values) {
				console.log(i)
				s.emails = s.emails.concat(i.emails)
				s.sites = s.sites.concat(i.sites)
			}

			if (res) respondWithEmails(s.emails, s.sites, res)
			return s
		})
	} else {
		respondWithEmails(s.emails, s.sites, res)
		return s
	}
}

function respondWithEmails(emails, sites, res = null) {
	if (!res) return

	emails = uniq(emails)
	console.log("Response:", emails)

	let html = "<h3>Znalezione adresy email:</h3>"
	for (let i of emails) html += i + "<br />"

	html += "<h4>Sprawdzone strony:</h4>"
	for (let i of sites) html += i + "<br />"

	res.write(html)
	res.end()
}

function findEmails(str) {
	return [...str.matchAll(/\w+\@\w+\.\w+/g)].map((i) => i[0])
}
function findLinks(str) {
	let links = [...str.matchAll(/<a\shref=\"[^#"\.][^\"]+/g)]
	return links.map((i) => (i = i[0].substr(9)))
}

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
			res.writeHead(200, { "Content-Type": "text/html" })
			search(site, searchLevel, res)
	}
})

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`)
})
