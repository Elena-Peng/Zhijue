import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { ToastProvider } from './components/Toast'
import { Greenhouse } from './pages/Greenhouse'
import { PlantDetail } from './pages/PlantDetail'
import { Identify } from './pages/Identify'
import { Discover } from './pages/Discover'
import { SpeciesDetail } from './pages/SpeciesDetail'
import { Community } from './pages/Community'
import { Profile } from './pages/Profile'
import { PostDetail } from './pages/PostDetail'
import { Publish } from './pages/Publish'
import { Settings } from './pages/Settings'

export function App() {
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="stage">
      <div className="phone">
        <ToastProvider>
          <div className="phone-scroll" ref={scrollRef}>
            <Routes>
              <Route path="/" element={<Greenhouse />} />
              <Route path="/plant/:id" element={<PlantDetail />} />
              <Route path="/identify" element={<Identify />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/species/:id" element={<SpeciesDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/publish" element={<Publish />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Greenhouse />} />
            </Routes>
          </div>
          <TabBar />
        </ToastProvider>
      </div>
    </div>
  )
}
