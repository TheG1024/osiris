import { useState, useCallback } from 'react';

interface ViewState3D {
  pitch: number;
  bearing: number;
  zoom: number;
}

interface Use3DModeReturn {
  is3D: boolean;
  toggle3D: () => void;
  animateTo3D: () => void;
  animateTo2D: () => void;
  currentPitch: number;
  targetPitch: number;
}

export default function use3DMode(initialState = false): Use3DModeReturn {
  const [is3D, setIs3D] = useState(initialState);
  
  // Target pitch values
  const currentPitch = is3D ? 45 : 0;
  const targetPitch = is3D ? 0 : 45;

  const animateTo3D = useCallback(() => {
    console.log('Animating to 3D view (pitch 45°)');
    setIs3D(true);
  }, []);

  const animateTo2D = useCallback(() => {
    console.log('Animating to 2D view (pitch 0°)');
    setIs3D(false);
  }, []);

  const toggle3D = useCallback(() => {
    if (is3D) {
      animateTo2D();
    } else {
      animateTo3D();
    }
  }, [is3D, animateTo3D, animateTo2D]);

  return {
    is3D,
    toggle3D,
    animateTo3D,
    animateTo2D,
    currentPitch,
    targetPitch
  };
}

// Helper function to create smooth pitch transition
export function createPitchTransition(
  fromPitch: number,
  toPitch: number,
  duration: number = 1000
): (timestamp: number) => Partial<ViewState3D> {
  const startTime = Date.now();
  
  return (timestamp: number): Partial<ViewState3D> => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-in-out)
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    const currentPitch = fromPitch + (toPitch - fromPitch) * easedProgress;
    
    return {
      pitch: currentPitch,
      // Keep zoom and bearing stable during transition
      zoom: 8,
      bearing: 0
    };
  };
}

// Animation loop for smooth transitions
export function animateViewState(
  fromState: ViewState3D,
  toState: ViewState3D,
  duration: number = 1000,
  onUpdate?: (state: Partial<ViewState3D>) => void
): void {
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easedProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    const interpolatedState = {
      pitch: fromState.pitch + (toState.pitch - fromState.pitch) * easedProgress,
      bearing: fromState.bearing + (toState.bearing - fromState.bearing) * easedProgress,
      zoom: fromState.zoom + (toState.zoom - fromState.zoom) * easedProgress
    };
    
    onUpdate?.(interpolatedState);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
}