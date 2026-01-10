'use client'

import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword))
      const isSmallScreen = window.innerWidth < 768
      
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
