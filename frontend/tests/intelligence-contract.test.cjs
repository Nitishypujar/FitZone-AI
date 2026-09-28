const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const hook = fs.readFileSync(path.join(root, 'src', 'hooks', 'useFitnessBrain.js'), 'utf8')
const app = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8')
const scroll = fs.readFileSync(path.join(root, 'src', 'components', 'ScrollToTop.jsx'), 'utf8')
const dashboard = fs.readFileSync(path.join(root, 'src', 'pages', 'Dashboard.jsx'), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(hook.includes('/api/intelligence/snapshot?timezone='), 'Fitness Brain hook must use the canonical intelligence snapshot route.')
assert(hook.includes('data?.data || data?.intelligence || data'), 'Fitness Brain hook must unwrap the API data envelope.')
assert(app.includes("import ScrollToTop from './components/ScrollToTop'"), 'ScrollToTop must be imported by App.')
assert(app.includes('<ScrollToTop />'), 'ScrollToTop must be rendered by App.')
assert(scroll.includes("window.scrollTo({ top: 0, left: 0, behavior: 'auto' })"), 'ScrollToTop must reset the document scroll position on route changes.')
assert(dashboard.includes('/api/intelligence/snapshot?timezone='), 'Dashboard must consume the canonical intelligence snapshot.')

console.log('Frontend intelligence/navigation contract: PASS')
