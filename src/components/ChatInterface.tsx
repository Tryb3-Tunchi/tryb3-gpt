import React, { useState } from "react";
import { Send, BookOpen, Languages } from "lucide-react";
import { Message, SupportedLanguage, SUPPORTED_LANGUAGES } from "../types";
import { AITextProcessor } from "../services/api";

const WelcomeScreen: React.FC<{ onContinue: () => void }> = ({
  onContinue,
}) => (
  <div className="flex relative flex-col items-center justify-center min-h-screen text-center m-auto   bg-gray-900 text-white animate-fade-in">
    <div
      style={{
        opacity: "",
        backgroundImage: 'url("/Chatbot.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "50vw",
      }}
      className="w-full  m-auto h-72 top-20 absolute 
    "
    ></div>
    <h1 className="text-5xl font-extrabold tracking-wider  my-6 mt-[200px] space-y-10">
      Welcome to Tunchi AI Chat
    </h1>
    <p className="text-lg mb-8">
      Make sure to use Chrome for maximum efficiency.
    </p>
    <button
      onClick={onContinue}
      className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105"
    >
      Continue
    </button>
  </div>
);

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date(),
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    try {
      // 1. Call the language detection API
      const langResult: any = await AITextProcessor.detectLanguage(inputText);
      console.log(
        "Language Detection API response:",
        langResult.data?.[0] ?? "No lang detected"
      );

      // 2. Extract the detected language
      const detectedLanguages =
        langResult &&
        langResult.success &&
        Array.isArray(langResult.data) &&
        langResult.data.length > 0 &&
        langResult.data[0].confidence > 0.001
          ? langResult.data[0]?.detectedLanguage ?? "Unknown" // Pick the most confident language
          : "Unknown";

      // 3. Create a bot message
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Detected Language: ${detectedLanguages}`,
        timestamp: new Date(),
        sender: "bot",
      };
      console.log("detedet lang:", detectedLanguages);
      //   console.log(langResult.data[0]?.language ?? "No lang detected");

      // 4. Add the bot response to the chat
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    setIsProcessing(true);
    try {
      const result = await AITextProcessor.translateText({
        text: message.text,
        targetLanguage: selectedLanguage,
      });
      if (result.success && result.data) {
        const translatedMessage: Message = {
          id: Date.now().toString(),
          text: `Translate: ${result.data}`,
          timestamp: new Date(),
          sender: "bot",
        };
        setMessages((prev) => [...prev, translatedMessage]);
      }
    } catch (error) {
      console.error("Error translating:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarize = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    setIsProcessing(true);
    try {
      const result = await AITextProcessor.summarizeText(message.text);
      if (result.success && result.data) {
        const summaryMessage: Message = {
          id: Date.now().toString(),
          text: `Summary: ${result.data}`,
          timestamp: new Date(),
          sender: "bot",
        };
        setMessages((prev) => [...prev, summaryMessage]);
      }
    } catch (error) {
      console.error("Error summarizing:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showWelcome)
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;

  return (
    <div
      className="flex flex-col  h-screen max-w-4xl mx-auto p-4 bg-gray-900 text-white"
      style={{
        backgroundImage: 'url("/cha2.jpg")',
        backgroundSize: "cover",
      }}
    >
      <div className="flex-1 overflow-y-auto mt-10 space-y-1 ">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] p-3 mt-5 rounded-lg transition-all ${
                message.sender === "user"
                  ? "bg-gray-100 text-black"
                  : "bg-gray-700 text-white"
              }`}
            >
              <p>{message.text}</p>
              {message.sender === "user" && (
                <div className="mt-2 flex gap-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) =>
                      setSelectedLanguage(e.target.value as SupportedLanguage)
                    }
                    className="px-3 py-2 bg-gray-600 text-white rounded"
                  >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleTranslate(message.id)}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50"
                    disabled={isProcessing}
                    aria-label="Translate"
                  >
                    <Languages size={20} />
                  </button>
                  {message.text.length > 150 && (
                    <button
                      onClick={() => handleSummarize(message.id)}
                      className="p-2 border bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                      disabled={isProcessing}
                      aria-label="Summarize"
                    >
                      <BookOpen size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex p-2 gap-1 bg-gray-700 border-2 border-black m-2  rounded-xl shadow-lg">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 w-full overflow-ellipsis overscroll-y-contain focus:outline-none focus:ring-0 outline-none p-2 bg-transparent  text-white  resize-none overflow-y-hidden"
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={isProcessing || !inputText.trim()}
          className="p-2  mr-2  h-10 m-auto  bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
