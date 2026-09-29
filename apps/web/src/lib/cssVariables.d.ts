// CSS variables in a `style` prop, e.g. `style={{ '--sky-night': 0.4 }}`. An interface, as
// only an interface can add to React's own type.
import 'react'

declare module 'react' {
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined
  }
}
