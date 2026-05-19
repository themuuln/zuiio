export const SIDEBAR_TRANSITIONS = {
  expand: {
    duration: 300,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    className: 'duration-300 ease-out-expo',
  },
  collapse: {
    duration: 250,
    easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
    className: 'duration-250 ease-in-expo',
  },
  label: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    staggerEnter: 50,
    staggerExit: 0,
    className: 'duration-200 ease-out-quart',
  },
  content: {
    duration: 250,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    className: 'duration-250 ease-out-quart',
  },
} as const
