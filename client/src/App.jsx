import { Routes, Route, useLocation } from 'react-router-dom'
import { BackdropProvider } from './lib/backdrop/Backdrop.jsx'
import { TransitionProvider } from './lib/transition.jsx'
import { usePageTransition } from './lib/usePageTransition.js'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import Piece from './pages/Piece.jsx'
import About from './pages/About.jsx'
import Blog from './pages/Blog.jsx'
import Post from './pages/Post.jsx'
import Published from './pages/Published.jsx'
import NotFound from './pages/NotFound.jsx'
import SiteProvider from './data/SiteProvider.jsx'

function Page() {
  const location = useLocation()
  const { leaving } = usePageTransition()
  return (
    // Keyed by path so every page mounts fresh and plays its entrance.
    <main key={location.pathname} className={`page ${leaving ? 'is-leaving' : ''}`}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/art/:slug" element={<Piece />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/published" element={<Published />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </main>
  )
}

export default function App() {
  return (
    <BackdropProvider>
      <TransitionProvider>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteProvider>
          <Header />
          <div id="main">
            <Page />
          </div>
        </SiteProvider>
      </TransitionProvider>
    </BackdropProvider>
  )
}
