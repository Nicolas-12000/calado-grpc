import Dashboard from "@/components/Dashboard";
import { Mark } from "@/components/Logo";

export default function Page() {
  return (
    <main className="slide">
      <span className="tag">Programación Web · Taller gRPC</span>
      <header className="hero">
        <h1>
          <Mark size={72} /> Calado
        </h1>
        <p className="lead">
          En Kaub el Rin se cruza a pie cuando baja de 78 cm. Ese número frena barcazas, acero y gasolina en
          media Alemania. Aquí lo ves llegar por gRPC.
        </p>
      </header>
      <Dashboard />
    </main>
  );
}
