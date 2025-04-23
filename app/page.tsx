// pages/index.tsx
"use client"
import type { NextPage } from 'next'
import ElectricFieldSimulator from '../components/ElectricFieldSimulator'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <div className="container">
      <Head>
        <title>Προσομοιωτής ηλεκτρικού πεδίου | Φυσική διαδραστική επίδειξη</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <h1>Προσομοιωτής γραμμής ηλεκτρικού πεδίου</h1>
      <p className="instruction">
      Κάντε κλικ για να τοποθετήσετε το φορτίο, σύρετε για να μετακινήσετε τη θέση και παρατηρήστε την κατανομή του ηλεκτρικού πεδίου.
      </p>

      <ElectricFieldSimulator />

      <style jsx global>{`
        :root {
          --primary-color: #2c3e50;
          --active-color: #3498db;
          user-select: none;
        }

        body {
          margin: 0;
          padding: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
            Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f5f6fa;
        }

        .container {
          max-width: 90%;
          margin: 0 auto;
        }

        h1 {
          color: var(--primary-color);
          border-bottom: 2px solid #eee;
          padding-bottom: 0.5em;
          text-align: center;
          font-weight: bold;
        }

        .instruction {
          color: #7f8c8d;
          margin: 1em 0;
        }

        .controls {
          margin: 1em 0;
          padding: 1em;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          width: 100%;
        }

        button {
          padding: 0.6em 1.2em;
          margin-right: 0.8em;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95em;
        }

        button:hover {
          background: #e9ecef;
        }

        button.active {
          background: var(--active-color);
          color: white;
          border-color: var(--active-color);
        }

        label {
          margin-left: 1em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
        }

        canvas {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;

        }

        canvas:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default Home;