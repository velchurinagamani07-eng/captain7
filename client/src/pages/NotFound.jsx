import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <section className="grid min-h-screen place-items-center bg-captain-black px-4 text-center">
      <div>
        <div className="font-display text-9xl text-captain-gold">404</div>
        <h1 className="font-serif text-3xl font-bold text-white">Page not found</h1>
        <Link to="/" className="mt-6 inline-block"><Button>Go Home</Button></Link>
      </div>
    </section>
  );
}
