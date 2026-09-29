// jsdom has no AnimationEvent, so React (which checks when it loads) would listen for
// `webkitAnimationEnd` rather than `animationend`, and `fireEvent.animationEnd` would go
// unheard. setup.ts imports this before anything loads React.
if (!('AnimationEvent' in window)) {
  Object.defineProperty(window, 'AnimationEvent', { value: class extends Event {} })
}
