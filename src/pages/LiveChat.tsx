import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebsiteSelector } from "@/components/WebsiteSelector";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User, Bot, UserCog, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

// Định nghĩa kiểu dữ liệu cho Chat và Message
interface Chat {
  chatId: string; // e.g., "t9z0tcdvmvb@127.0.0.1/testLib.html"
  domain: string;
  chat_session_id: string;
  name: string;
  avatar: string;
  lastActivity: number;
  isBotActive: boolean;
}

interface Message {
  id: string;
  sender: "bot" | "user" | "admin";
  message: string;
  timestamp: string;
  type: "text";
  content: string | null;
  isRead: boolean;
}

// Hàm giả định cho việc xử lý token hết hạn (cần được thay thế bằng logic thực tế)
const useTokenExpiration = () => ({
  triggerTokenExpiration: () => {
    console.warn("Token expiration triggered (Mock)");
    // Logic thực tế sẽ là redirect hoặc hiển thị modal
  },
});

const API_BASE_URL = "https://n8n.vazo.vn/api";

export default function LiveChat() {
  const { toast } = useToast();
  const { triggerTokenExpiration } = useTokenExpiration();
  const [activeChats, setActiveChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 1. Lấy danh sách active chats
  const fetchActiveChats = async () => {
    setIsLoadingChats(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get-active-chats`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setActiveChats(data.activeChats || []);
      } else {
        throw new Error(data.message || "Không thể lấy danh sách active chats.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      console.error("Lỗi khi lấy active chats:", err);
      toast({
        title: "Lỗi tải cuộc trò chuyện",
        description: errorMessage,
        variant: "destructive",
      });
      if (err instanceof Error && err.message.includes("401")) {
        triggerTokenExpiration();
      }
    } finally {
      setIsLoadingChats(false);
    }
  };

  // 2. Lấy lịch sử chat khi chọn một cuộc trò chuyện
  const fetchChatHistory = async (chat: Chat) => {
    setIsLoadingMessages(true);
    try {
      const [chatId, domain] = chat.chatId.split("@");
      const response = await fetch(
        `${API_BASE_URL}/get-history?userId=${chatId}&domain=${encodeURIComponent(
          domain
        )}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setChatMessages(data.messages || []);
      } else {
        throw new Error(data.message || "Không thể lấy lịch sử chat.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      console.error("Lỗi khi lấy lịch sử chat:", err);
      toast({
        title: "Lỗi tải lịch sử tin nhắn",
        description: errorMessage,
        variant: "destructive",
      });
      if (err instanceof Error && err.message.includes("401")) {
        triggerTokenExpiration();
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Effect để tự động tải danh sách chats
  useEffect(() => {
    const loadChats = async () => {
      // Logic của fetchActiveChats
      setIsLoadingChats(true);
      try {
        const response = await fetch(`${API_BASE_URL}/get-active-chats`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setActiveChats(data.activeChats || []);
        } else {
          throw new Error(data.message || "Không thể lấy danh sách active chats.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
        console.error("Lỗi khi lấy active chats:", err);
        toast({
          title: "Lỗi tải cuộc trò chuyện",
          description: errorMessage,
          variant: "destructive",
        });
        if (err instanceof Error && err.message.includes("401")) {
          triggerTokenExpiration();
        }
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats(); // Gọi lần đầu
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, []); // Chỉ chạy một lần khi component mount, không có dependencies

  // Effect để tải lịch sử chat khi selectedChat thay đổi
  useEffect(() => {
    if (selectedChat) {
      const loadHistory = async () => {
        // Logic của fetchChatHistory
        setIsLoadingMessages(true);
        try {
          const [chatId, domain] = selectedChat.chatId.split("@");
          const response = await fetch(
            `${API_BASE_URL}/get-history?userId=${chatId}&domain=${encodeURIComponent(
              domain
            )}`,
            { credentials: "include" }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.success) {
            setChatMessages(data.messages || []);
          } else {
            throw new Error(data.message || "Không thể lấy lịch sử chat.");
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
          console.error("Lỗi khi lấy lịch sử chat:", err);
          toast({
            title: "Lỗi tải lịch sử tin nhắn",
            description: errorMessage,
            variant: "destructive",
          });
          if (err instanceof Error && err.message.includes("401")) {
            triggerTokenExpiration();
          }
        } finally {
          setIsLoadingMessages(false);
        }
      };

      loadHistory(); // Gọi lần đầu
      const interval = setInterval(loadHistory, 5000);
      return () => clearInterval(interval);
    } else {
      setChatMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]); // Chỉ chạy khi selectedChat thay đổi

  // Xử lý chọn chat
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case "user":
        return <User className="h-4 w-4" />;
      case "bot":
        return <Bot className="h-4 w-4" />;
      case "admin":
        return <UserCog className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    const messageToSend = message.trim();
    setMessage(""); // Xóa tin nhắn ngay lập tức

    // 1. Cập nhật lạc quan (Optimistic Update)
    const tempMessage: Message = {
      id: `msg_${Date.now()}_temp`,
      sender: "admin",
      message: messageToSend,
      timestamp: new Date().toISOString(),
      type: "text",
      content: null,
      isRead: true,
    };
    setChatMessages((prev) => [...prev, tempMessage]);

    try {
      const [chatId, domain] = selectedChat.chatId.split("@");
      const response = await fetch(
        `${API_BASE_URL}/send-message-to-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: `${chatId}@${domain}`,
            message: messageToSend,
            sender: "admin",
          }),
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Không thể gửi tin nhắn.");
      }
      // Nếu thành công, tin nhắn sẽ được tải lại trong interval của fetchChatHistory
      // Không cần cập nhật lại state ở đây trừ khi API trả về ID thật
      // Giữ nguyên optimistic update và chờ interval tải lại để đảm bảo đồng bộ
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
      console.error("Lỗi khi gửi tin nhắn:", err);
      toast({
        title: "Gửi tin nhắn thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      // Hoàn tác optimistic update (tùy chọn, ở đây ta chỉ dựa vào interval để đồng bộ)
      // Hoặc có thể thêm logic để đánh dấu tin nhắn là lỗi
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat trực tiếp</h1>
          <p className="text-muted-foreground">Tham gia chat với khách hàng đang online</p>
        </div>
        <WebsiteSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-250px)]">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>
              Cuộc trò chuyện đang diễn ra ({activeChats.length})
              {isLoadingChats && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-y-auto flex-1">
            {activeChats.map((chat) => (
              <div
                key={chat.chatId}
                onClick={() => handleSelectChat(chat)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?.chatId === chat.chatId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/70"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{chat.name}</span>
                  {/* TODO: Thêm logic đếm tin nhắn chưa đọc nếu có */}
                  {/* {conv.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {conv.unreadCount}
                    </Badge>
                  )} */}
                </div>
                <p className="text-sm opacity-80 truncate">{chat.domain}</p>
                <p className="text-xs opacity-60">
                  Hoạt động cuối: {new Date(chat.lastActivity).toLocaleTimeString('vi-VN')}
                </p>
              </div>
            ))}
            {activeChats.length === 0 && !isLoadingChats && (
              <p className="text-center text-muted-foreground py-8">
                Không có cuộc trò chuyện nào đang diễn ra
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>
              {selectedChat
                ? selectedChat.name
                : "Chọn cuộc trò chuyện"}
              {isLoadingMessages && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {selectedChat ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 p-6">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === "user" ? "" : "flex-row-reverse"}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getSenderIcon(msg.sender)}</AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col ${msg.sender === "user" ? "" : "items-end"}`}>
                        <span className="text-xs text-muted-foreground mb-1">
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                        </span>
                        <div
                          className={`rounded-lg px-4 py-2 max-w-md ${
                            msg.sender === "user"
                              ? "bg-muted"
                              : msg.sender === "bot"
                              ? "bg-secondary" // Bot messages
                              : "bg-primary text-primary-foreground" // Admin messages
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 p-6 border-t">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Chọn một cuộc trò chuyện để bắt đầu
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
