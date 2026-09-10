import { TLink } from '../lib/transition.jsx'
import { Divider, InstagramIcon } from './Ornaments.jsx'
import { useSite } from '../data/useSite.js'

export default function Footer() {
  const { about } = useSite()
  return (
    <footer className="footer">
      <div className="footer__inner">
        <TLink to="/" className="footer__logo">
          Elena
        </TLink>
   <p> let me know if you want something in the footer :) </p>
      </div>
    </footer>
  )
}
