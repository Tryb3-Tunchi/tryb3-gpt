// src/App.tsx

import { ChatInterface } from "./components/ChatInterface";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white  fixed w-full shadow-gray-700 shadow-lg">
        <div className="max-w-4xl flex items-center justify-between mx-auto py-4 px-4">
          <h1 className="text-xl font-bold  text-gray-800">Tryb3-GPT</h1>
          <h1 className=" font-mono text-gray-800">HNG AI-chat</h1>
        </div>
      </header>
      <main>
        <ChatInterface />
      </main>
    </div>
  );
}

export default App;
