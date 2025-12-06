import { useRef, useEffect } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useMathTutor } from "@/hooks/useMathTutor";
import { Button } from "@/components/ui/button";
import { RefreshCw, GraduationCap, Lightbulb, Target } from "lucide-react";

const Index = () => {
  const {
    messages,
    isLoading,
    hasStarted,
    imageBase64,
    startWithImage,
    sendMessage,
    reset,
  } = useMathTutor();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <GraduationCap className="h-4 w-4" />
            <span>Matematik Öğretmeni</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Adım Adım Matematik Öğren
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Probleminin fotoğrafını yükle, yapay zeka öğretmenin seni adım adım çözüme yönlendirsin.
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {!hasStarted ? (
            <>
              {/* Upload Section */}
              <div className="animate-slide-up">
                <ImageUpload
                  onImageSelect={startWithImage}
                  disabled={isLoading}
                />
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Anlayarak Öğren</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cevabı direkt vermek yerine, düşünmeni ve anlamanı sağlar.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Adım Adım Rehberlik</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Her adımda seni yönlendirir, takıldığında ipucu verir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Chat Section */}
              <div className="glass-card rounded-xl p-4">
                {/* Uploaded Image Preview */}
                {imageBase64 && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <div className="rounded-lg overflow-hidden bg-muted/30 max-h-48">
                      <img
                        src={imageBase64}
                        alt="Matematik problemi"
                        className="w-full h-full object-contain max-h-48"
                      />
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-4">
                  {messages.map((msg, idx) => (
                    <ChatMessage key={idx} role={msg.role} content={msg.content} />
                  ))}
                  {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                        <div className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                      </div>
                      <div className="chat-bubble-assistant">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-soft" />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-soft" style={{ animationDelay: "0.2s" }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-soft" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <ChatInput
                  onSend={sendMessage}
                  disabled={isLoading}
                  placeholder="Cevabını yaz veya 'next step' de..."
                />
              </div>

              {/* Reset Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Yeni Problem
                </Button>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Matematik öğrenmenin en etkili yolu: Adım adım düşünmek.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
