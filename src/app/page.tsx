import BillOfLadingForm from '../components/BillOfLadingForm';
import BillOfLadingGenerator from '../components/BillOfLadingGenerator';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bill of Lading Generator</h1>
      <BillOfLadingGenerator />
      <div style={{paddingTop:"20px"}}>
        <BillOfLadingForm />
      </div>
    </main>
  );
}
