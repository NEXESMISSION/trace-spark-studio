
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Crown, Send, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AnnaAI = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi there! I'm Anna, your drawing assistant. How can I help improve your artistic skills today?",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Mock premium status
  const isPremium = false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    // Mock responses based on user input keywords
    if (userMessage.toLowerCase().includes('anatomy')) {
      return "When drawing anatomy, start with simple shapes to establish proportions. For human figures, the body is typically 7-8 heads tall. Focus on understanding the skeletal and muscular structure beneath the skin to create more realistic figures.";
    } else if (userMessage.toLowerCase().includes('perspective')) {
      return "Perspective is all about creating the illusion of depth. Practice one-point, two-point, and three-point perspective regularly. Remember that objects get smaller as they recede into the distance, and parallel lines converge toward vanishing points.";
    } else if (userMessage.toLowerCase().includes('shading')) {
      return "Effective shading creates volume in your drawings. Consider your light source and identify where highlights, midtones, and shadows fall. Practice different shading techniques like hatching, cross-hatching, and blending to find what works best for your style.";
    } else if (userMessage.toLowerCase().includes('composition')) {
      return "Good composition guides the viewer's eye through your artwork. Try using the rule of thirds to place key elements. Create balance, establish a focal point, and use leading lines to direct attention. Remember that sometimes breaking composition rules intentionally can create interesting effects.";
    } else if (userMessage.toLowerCase().includes('color')) {
      return "When working with color, understanding color theory is essential. Complementary colors (opposite on the color wheel) create vibrant contrasts, while analogous colors (adjacent on the wheel) create harmony. Start with a limited palette to master color mixing before expanding.";
    } else {
      return "That's a great question about drawing! As you practice, remember that consistent daily drawing is more effective than occasional long sessions. Try using the tracing feature in TraceMate to understand proportions and shapes of reference images, then gradually work on creating original pieces from observation.";
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Anna AI Assistant is available with a premium subscription.",
        action: (
          <Button size="sm" variant="outline" className="gap-1">
            <Crown size={14} />
            <span>Upgrade</span>
          </Button>
        ),
      });
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Anna AI Drawing Assistant</h1>
      
      <div className="max-w-3xl mx-auto">
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-traceMate/20 text-traceMate">
                  <span className="font-semibold">A</span>
                </Avatar>
                <div>
                  <CardTitle>Anna</CardTitle>
                  <CardDescription>AI Drawing Assistant</CardDescription>
                </div>
              </div>
              
              {isPremium ? (
                <div className="bg-traceMate/10 text-traceMate text-xs font-medium px-2 py-1 rounded-full">
                  Premium Feature
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Crown size={14} />
                  <span className="text-xs">Premium required</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="border-t border-border">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {message.role === 'user' ? (
                          <div className="h-8 w-8 bg-traceMate rounded-full flex items-center justify-center text-white">
                            <User size={16} />
                          </div>
                        ) : (
                          <div className="h-8 w-8 bg-traceMate/20 rounded-full flex items-center justify-center text-traceMate">
                            A
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div 
                          className={`p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-traceMate text-white' 
                              : 'bg-muted'
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <div 
                          className={`text-xs text-muted-foreground mt-1 ${
                            message.role === 'user' ? 'text-right' : ''
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 bg-traceMate/20 rounded-full flex items-center justify-center text-traceMate">
                          A
                        </div>
                      </div>
                      <div>
                        <div className="p-3 rounded-lg bg-muted">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {!isPremium && messages.length <= 2 && (
              <div className="mt-4 mb-2 bg-muted rounded-md p-4">
                <div className="flex items-start gap-3">
                  <Crown className="text-traceMate mt-1" size={20} />
                  <div>
                    <h4 className="font-medium">Premium Feature</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Anna AI gives you personalized drawing tips, answers technique questions,
                      and helps you improve your artistic skills.
                    </p>
                    <Button className="mt-3" asChild>
                      <a href="/app/subscription">Upgrade to Premium</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t p-4">
            <form onSubmit={handleSendMessage} className="w-full flex gap-2">
              <Input
                placeholder="Ask Anna about drawing techniques..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || !isPremium}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || loading || !isPremium}
              >
                <Send size={18} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AnnaAI;
