const ENABLED = true
const LOCAL_STORAGE_KEY = 'navigationTitles'
const MAX_VISIBLE_CRUMBS = 4
const PHONE_SCREEN_WIDTH = 991
const ELLIPSIS = { title: '...' }

const ROADMAP_URL = "https://app.ow.consulting/roadmap"

const MAIN_DASHBOARD_PAGE = {
	index: -2,
	url: `https://app.ow.consulting/`,
}

const CLIENT_DASHBOARD_PAGE = {
	index: -1,
	url: null,
}

const URL_PARTS = [
	/^https?:\/\//i,
	/^app\.ow\.consulting/i,
	/^\//i,
]

let forceDashboardLinks = false

function matchClientName(string) {
	string = URL_PARTS.reduce((acc, re) => acc.replace(re, ''), string)
	return string.match(/^clients\/([\w_\-]+)/i)?.[1]
}

function getClientURL() {
	const homepageAnchors = Array.from(document.querySelectorAll(elements.homepage.selector))
	const clientNames = homepageAnchors.map(a => matchClientName(a.href))

	if (clientNames.length !== 0) {
		const nameCountMap = {}

		for (const name of clientNames)
			nameCountMap[name] = (nameCountMap[name] || 0) + 1

		const clientName = Object.entries(nameCountMap)
			.reduce((prev, current) => prev[1] > current[1] ? prev : current)[0]

		const clientURL = `https://app.ow.consulting/clients/${clientName}`
		localStorage.setItem('lastClientDashboardURL', clientURL)

		return clientURL
	}

	return localStorage.getItem('lastClientDashboardURL')
}

const elements = {
	page: {
		class: 'super-content',
	},
	homepage: {
		selector: '.notion-link.notion-page[href^="/clients/"]',
	},
	container: {
		type: 'div',
		class: 'breadcrumbs-container',
		hidingClass: 'breadcrumbs-container__hidden',
	},
	breadcrumbsWrapper: {
		type: 'div',
		class: 'super-navbar__breadcrumbs'
	},
	breadcrumbs: {
		type: 'div',
		class: 'notion-breadcrumb',
	},
	link: {
		type: 'a',
		class: 'notion-link notion-breadcrumb__item',
		classes: ['notion-link', 'notion-breadcrumb__item'],
	},
	ellipsis: {
		type: 'div',
		class: 'notion-link notion-breadcrumb__ellipsis',
		classes: ['notion-link', 'notion-breadcrumb__ellipsis'],
	},
	dropdownTrigger: {
		type: 'div',
		class: 'notion-link notion-breadcrumb__dropdown-trigger',
		classes: ['notion-link', 'notion-breadcrumb__dropdown-trigger'],
		svgIcon: `<svg viewBox="0 0 24 24">
			<path d="M7.38 21.01c.49.49 1.28.49 1.77 0l8.31-8.31c.39-.39.39-1.02 0-1.41L9.15 2.98c-.49-.49-1.28-.49-1.77 0s-.49 1.28 0 1.77L14.62 12l-7.25 7.25c-.48.48-.48 1.28.01 1.76"></path>
		</svg>`,
	},
	dropdownMenu: {
		type: 'div',
		class: 'dropdown-menu',
		hideClass: 'dropdown-menu__hide',
		classes: ['dropdown-menu', 'dropdown-menu__hide'],
	},
	dropdownMenuContent: {
		type: 'div',
		class: 'dropdown-menu__content',
		classes: ['dropdown-menu__content'],
	},
	dropdownItem: {
		type: 'div',
		class: 'dropdown-menu__item',
	},
	title: {
		type: 'div',
		class: 'notion-navbar__title notion-breadcrumb__title',
		classes: ['notion-navbar__title', 'notion-breadcrumb__title'],
	},
	divider: {
		type: 'span',
		class: 'notion-breadcrumb__divider',
		content: '/',
	},
}

function once(eventName, callback) {
	const onEvent = function (event) {
		document.removeEventListener(eventName, onEvent)
		callback(event)
	}

	document.addEventListener(eventName, onEvent)
}

function createLink(title, urls, isDropdownTrigger = false) {
	const multipleURLs = Array.isArray(urls) || isDropdownTrigger

	const element = isDropdownTrigger
		? elements.dropdownTrigger
		: (multipleURLs
			? elements.ellipsis
			: elements.link
		)

	const { type, classes } = element

	const linkElement = document.createElement(type)
	linkElement.classList.add(...classes)

	/** @type {HTMLElement} */
	let dropdownMenu = null
	let svg = null
	let isOpen = false

	const OPENED = '-90deg'
	const CLOSED = '90deg'

	function updateSVGAngle() {
		if (svg) {
			svg.style.rotate = isOpen ? OPENED : CLOSED
		}
	}

	if (multipleURLs) {
		dropdownMenu = document.createElement(elements.dropdownMenu.type)
		dropdownMenu.classList.add(...elements.dropdownMenu.classes)

		const dropdownMenuContent = document.createElement(elements.dropdownMenuContent.type)
		dropdownMenuContent.classList.add(...elements.dropdownMenuContent.classes)
		dropdownMenu.appendChild(dropdownMenuContent)

		for (const { title, url } of urls) {
			dropdownMenuContent.appendChild(createLink(title, url))
		}

		function toggle(newState) {
			newState = newState == null ? undefined : !newState
			isOpen = !dropdownMenu.classList.toggle(elements.dropdownMenu.hideClass, newState)
			updateSVGAngle()
			return isOpen
		}

		linkElement.addEventListener('click', () => {
			const isOpen = toggle()

			if (isOpen) {
				setTimeout(() => {
					once('click', () => {
						toggle(false)
					})
				}, 50)
			}
		})
	} else {
		linkElement.href = urls
	}

	const titleElement = document.createElement(elements.title.type)
	titleElement.classList.add(...elements.title.classes)

	if (isDropdownTrigger) {
		const span = document.createElement('span')
		span.innerText = title

		titleElement.innerHTML = elements.dropdownTrigger.svgIcon
		titleElement.insertBefore(span, titleElement.firstChild)

		svg = titleElement.querySelector('svg')
		updateSVGAngle()
	} else {
		titleElement.innerText = title
	}

	linkElement.appendChild(titleElement)

	if (dropdownMenu) {
		linkElement.appendChild(dropdownMenu)
	}

	return linkElement
}

function createDivider() {
	const dividerElement = document.createElement(elements.divider.type)
	dividerElement.classList.add(elements.divider.class)
	dividerElement.innerHTML = elements.divider.content
	return dividerElement
}

function createBreadcrumbs() {
	const container = document.getElementsByClassName(elements.container.class)[0]
	if (!container) return

	const breadcrumbsWrapper = document.createElement(elements.breadcrumbsWrapper.type)
	breadcrumbsWrapper.classList.add(elements.breadcrumbsWrapper.class)
	container.appendChild(breadcrumbsWrapper)

	const breadcrumbs = document.createElement(elements.breadcrumbs.type)
	breadcrumbs.classList.add(elements.breadcrumbs.class)
	breadcrumbsWrapper.appendChild(breadcrumbs)

	console.log('Breadcrumbs created')
	return breadcrumbsWrapper
}

function getBreadcrumbs() {
	const container = document.getElementsByClassName(elements.container.class)[0]
	if (!container) return null

	container.classList.remove(elements.container.hidingClass)

	let breadcrumbsWrapper = container.getElementsByClassName(elements.breadcrumbsWrapper.class)[0]

	if (!breadcrumbsWrapper) {
		breadcrumbsWrapper = createBreadcrumbs()
	}

	if (elements.breadcrumbsWrapper.style) {
		for (const rule in elements.breadcrumbsWrapper.style) {
			breadcrumbsWrapper.style[rule] = elements.breadcrumbsWrapper.style[rule]
		}
	}

	const breadcrumbs = breadcrumbsWrapper.getElementsByClassName(elements.breadcrumbs.class)[0]
	return breadcrumbs
}

function updateLinks(history, callback) {
	const breadcrumbs = getBreadcrumbs()
	if (!breadcrumbs) return false

	breadcrumbs.innerHTML = ''
	const screenWidth = window.innerWidth;

	if (screenWidth < PHONE_SCREEN_WIDTH) {
		const prevPages = history
			.slice(0, history.length - 1)
			.reverse()

		const link = createLink(history[history.length - 1].title, prevPages, true)
		breadcrumbs.appendChild(link)

		return true
	}

	for (let i = 0; i < history.length; ++i) {
		let entry = history[i]

		if (i !== 0) {
			const firstVisibleIndex = history.length - MAX_VISIBLE_CRUMBS

			if (i < firstVisibleIndex) {
				i = firstVisibleIndex
				entry = ELLIPSIS
			}

			const divider = createDivider()
			breadcrumbs.appendChild(divider)
		}

		const { title, url } = entry
		const urls = entry === ELLIPSIS
			? history.slice(1, i).reverse()
			: url

		const link = createLink(title, urls)
		breadcrumbs.appendChild(link)

		if (entry !== ELLIPSIS) {
			link.addEventListener('click', event => {
				event.preventDefault()
				callback(entry, i)
			})
		}
	}

	return true
}

function getNavigationHistory() {
	let navigationHistory = window.navigation.entries()
		.slice(0, window.navigation.currentEntry.index + 1)

	const lastClientDashboardPageIndex = navigationHistory.findLastIndex(entry => entry.url === CLIENT_DASHBOARD_PAGE.url)
	const lastRoadMapIndex = navigationHistory.findLastIndex(entry => entry.url === ROADMAP_URL)

	if (lastClientDashboardPageIndex !== -1 || lastRoadMapIndex !== -1) {
		navigationHistory = navigationHistory
			.slice(Math.max(lastClientDashboardPageIndex, lastRoadMapIndex))
	}

	const forceDashboardLinks = lastRoadMapIndex === -1

	if (forceDashboardLinks && CLIENT_DASHBOARD_PAGE.url) {
		navigationHistory.unshift(CLIENT_DASHBOARD_PAGE)
	}

	navigationHistory = navigationHistory
		.map(entry => ({
			...entry,
			url: trimGoto(entry.url),
		}))
		.filter((entry, index, array) => {
			if (index === 0)
				return true

			const prevItem = array[index - 1]
			return prevItem.url !== entry.url
		})

	const currentHref = location.href
	const currentEntryIndex = navigationHistory.findIndex(entry => entry.url === currentHref)
	navigationHistory = navigationHistory.slice(0, (currentEntryIndex + 1) || undefined)

	const fetchingURLs = new Set()

	navigationHistory = navigationHistory
		.map(entry => {
			const url = trimGoto(entry.url)

			const newEntry = {
				index: entry.index,
				title: getTitle(url),
				url: url,
			}

			if (!newEntry.title) {
				newEntry.title = 'Loading...'

				if (!fetchingURLs.has(url)) {
					fetchingURLs.add(url)

					fetchTitle(url).then(title => {
						setTitle(url, title || 'Unknown')
						updateBreadcrumbs()
					})
				}
			}

			return newEntry
		})

	return navigationHistory
}

function updateBreadcrumbs() {
	const atMainDashboard = window.navigation.currentEntry.url === MAIN_DASHBOARD_PAGE.url

	if (!atMainDashboard) {
		CLIENT_DASHBOARD_PAGE.url = getClientURL()
	}

	const navigationHistory = atMainDashboard
		? []
		: getNavigationHistory()

	const success = updateLinks(navigationHistory, (clickedEntry, index) => {
		console.log(`#${index} was clicked`)
		console.log(clickedEntry)

		const entryToGoTo = navigation.entries()
			.slice(0, clickedEntry.index + 1)
			.findLast(e => e.url === clickedEntry.url)

		console.log(entryToGoTo)

		if (entryToGoTo) {
			const back = window.navigation.currentEntry.index - entryToGoTo.index
			console.log(`Going back by ${back} pages`)

			if (back > 0) {
				window.history.go(-back)
				navigationHistory.splice(navigationHistory.length - back)
			}
		} else {
			window.history.pushState({}, '', clickedEntry.url)
			window.location.reload()
		}

		updateBreadcrumbs()

		// if (index >= window.navigation.currentEntry.index) {

		// 	const back = window.navigation.currentEntry.index

		// 	if (back > 0) {
		// 		window.history.go(-back)
		// 	}

		// 	window.history.pushState(window.history.state)
		// 	window.history.back()
		// 	window.history.replaceState(window.history.state, '', CLIENT_DASHBOARD_PAGE.url)
		// 	window.location.reload()

		// 	return
		// }
	})

	if (!success) {
		clearTimeout(window.updateBreadcrumbsTimeout)
		window.updateBreadcrumbsTimeout = setTimeout(updateBreadcrumbs, 50)
	}
}

function trimGoto(url) {
	return url.match(/^[^\s#]+/)?.[0] || url
}

async function fetchTitle(url) {
	url = trimGoto(url)

	if (url === trimGoto(location.href))
		return document.title

	return fetch(url)
		.then(res => res.text())
		.then(data => data.match(/<title>(.+?)<\/title>/)?.[1])
}

function getTitle(url) {
	if (!url) return null

	const cache = getCache()
	const title = cache[url]

	if (title && title.expirationTimestamp && title.expirationTimestamp < Date.now()) {
		removeTitle(url)
		return null
	}

	return title?.value
}

function setTitle(url, title) {
	if (!url) return

	const cache = getCache()

	cache[url] = {
		value: title,
		expirationTimestamp: Date.now() + 3600e3,
	}

	setCache(cache)
}

function removeTitle(url) {
	if (!url) return
	const cache = getCache()
	delete cache[url]
	setCache(cache)
}

function getCache() {
	const string = localStorage?.getItem(LOCAL_STORAGE_KEY) || '{}'

	try {
		return JSON.parse(string)
	} catch (_) {
		return {}
	}
}

function setCache(cache) {
	cache ||= {}
	const now = Date.now()

	for (const key in cache) {
		const { expirationTimestamp } = cache[key]

		if (!expirationTimestamp || expirationTimestamp < now) {
			delete cache[key]
		}
	}

	const json = JSON.stringify(cache)
	localStorage?.setItem(LOCAL_STORAGE_KEY, json)
}

async function initBreadcrumbs() {
	// We will have to use simplified custom implementation of Navigation API for Mozilla and Safari support
	window.navigation = resolveNavigation(updateBreadcrumbs)
	setTimeout(updateBreadcrumbs, 50)

	let resizeTimeout = null

	window.addEventListener('resize', () => {
		clearTimeout(resizeTimeout)
		resizeTimeout = setTimeout(updateBreadcrumbs, 250)
	})

	console.log('Breadcrumbs initialized')
}

function resolveNavigation(navigationEventCallback) {
	if (window.navigation && !window.navigation.__CUSTOM_NAVIGATION) {
		window.navigation.addEventListener('navigate', () => {
			setTimeout(navigationEventCallback, 50)
		})

		return window.navigation
	}

	window.navigation = resolveCustomNavigation(navigationEventCallback)
	window.navigation._init()
	return window.navigation
}

/**
 * @typedef {Object} Entry
 * @property {string} url
 * @property {number} index
 *
 * @typedef {Object} State
 * @property {Entry[]} entries
 */
function resolveCustomNavigation(navigationEventCallback) {
	const CustomNavigation = {
		/** @type {true} */
		__CUSTOM_NAVIGATION: true,

		/** @type {Entry[]} */
		_entries: null,

		/** @type {number | null} */
		_interval: null,

		_init() {
			let prevEntry = {
				index: -1,
			}

			this._interval = setInterval(() => {
				if (prevEntry.index !== this.getCurrentEntryState()?.index) {
					console.log('before processing:')
					console.log(this.entries())
					console.log(this.getCurrentEntryState())

					let currentEntry = this.getCurrentEntryState() || this.entries().find(entry => entry.url === window.location.href)

					if (currentEntry) {
						this.saveEntries()
					} else {
						const newEntries = this.entries().slice(0, prevEntry ? prevEntry.index + 1 : undefined)
						currentEntry = this.createEntry()
						newEntries.push(currentEntry)

						this.saveEntries(newEntries)
					}

					this.setCurrentEntryState(currentEntry)

					prevEntry = currentEntry
					this.onNavigate()
				}
			}, 50);
		},

		_destroy() {
			clearInterval(this._interval)
			this._interval = null

			delete history.state.__CUSTOM_NAVIGATION_CURRENT_ENTRY
			delete history.state.__CUSTOM_NAVIGATION_ENTRIES

			history.replaceState(history.state, '')
		},

		onNavigate() {
			console.log('after processing:')
			console.log(this.entries())
			console.log(this.getCurrentEntryState())

			navigationEventCallback()
		},

		createEntry(url = window.location.href) {
			return {
				index: this.entries().length,
				url,
			}
		},

		/**
		 * @returns {Entry}
		 */
		getCurrentEntryState() {
			return window.history.state?.__CUSTOM_NAVIGATION_CURRENT_ENTRY
		},

		/**
		 * @param {Entry} entry
		 */
		setCurrentEntryState(entry) {
			window.history.replaceState({
				...window.history.state,
				__CUSTOM_NAVIGATION_CURRENT_ENTRY: {
					...window.history.state.__CUSTOM_NAVIGATION_CURRENT_ENTRY,
					...entry,
				},
			}, '')
		},

		saveEntries(entries = this.entries()) {
			this._entries = entries

			history.replaceState({
				...window.history.state,
				__CUSTOM_NAVIGATION_ENTRIES: entries,
			}, '')
		},

		entries() {
			return this._entries = this._entries
				|| window.history.state?.__CUSTOM_NAVIGATION_ENTRIES
				|| []
		},

		get currentEntry() {
			return this.getCurrentEntryState()
		},
	}

	return CustomNavigation
}

if (ENABLED) {
	if (window.__BREADCRUMBS_ALTERNATIVE_INITIALIZATION_METHOD) {
		const interval = setInterval(() => {
			const page = document.getElementsByClassName(elements.page.class)[0]

			if (page) {
				clearInterval(interval)

				const seconds = 1
				console.log(`Timing out initialization by ${seconds} seconds`)

				setTimeout(() => {
					initBreadcrumbs()
				}, seconds * 1e3)
			}
		}, 100);
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			const interval = setInterval(() => {
				const page = document.getElementsByClassName(elements.page.class)[0]

				if (page) {
					clearInterval(interval)
					initBreadcrumbs()
				}
			}, 100);
		})
	}
}