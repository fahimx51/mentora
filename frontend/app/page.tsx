import Navbar from '@/components/header/Navbar';
import ToggleMode from '@/components/header/toggle-mode';
import HeroSection from '@/components/hero/hero-section';
import React from 'react'

function page() {
  return (
    <div>
      <Navbar />
      <HeroSection />
    </div>
  )
}

export default page