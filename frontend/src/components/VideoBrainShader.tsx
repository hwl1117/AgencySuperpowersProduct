'use client'

import { Warp } from "@paper-design/shaders-react"

export default function VideoBrainShader() {
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'

  const lightColors = [
    "hsl(200, 100%, 20%)",
    "hsl(160, 100%, 75%)",
    "hsl(180, 90%, 30%)",
    "hsl(170, 100%, 80%)",
  ]

  const darkColors = [
    "hsl(200, 100%, 12%)",
    "hsl(160, 100%, 45%)",
    "hsl(180, 90%, 18%)",
    "hsl(170, 100%, 50%)",
  ]

  const colors = isDark ? darkColors : lightColors

  return (
    <Warp
      style={{ height: '100%', width: '100%', display: 'block' }}
      proportion={0.45}
      softness={1}
      distortion={0.25}
      swirl={0.8}
      swirlIterations={10}
      shape="checks"
      shapeScale={0.1}
      scale={1}
      rotation={0}
      speed={1}
      colors={colors}
    />
  )
}
