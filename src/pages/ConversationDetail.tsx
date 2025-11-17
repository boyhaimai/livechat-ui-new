import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, User, Bot, UserCog } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockConversations } from "@/data/mockData";
import axios from "axios";

const API_BASE_URL = "https://n8n.vazo.vn";

interface Message {
  sessionId: string;
  timestamp: string;
  message: string;
  sender: "bot" | "user" | "admin";
  domain: string;
  rating: string | null;
}

const getIdConfig = (): string | null => {
  return localStorage.getItem("selectedConfigId");
};

const fetchConversationDetail = async (sessionId: string, idConfig: string): Promise<Message[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/get-history-admin`, {
      params: {
        id_config: idConfig,
        search: sessionId,
        limit: 1000,
      },
      withCredentials: true,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Lỗi khi lấy chi tiết hội thoại.");
    }

    const messages: Message[] = response.data.messages;
    const conversationMessages = messages.filter(msg => msg.sessionId === sessionId);
    conversationMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return conversationMessages;

  } catch (error) {
    console.error("Lỗi khi gọi API chi tiết hội thoại:", error);
    throw error;
  }
};

export default function ConversationDetail() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversationInfo = mockConversations.find((c) => c.id === sessionId);

  useEffect(() => {
    if (!sessionId) return;

    const loadConversation = async () => {
      setLoading(true);
      setError(null);

      const idConfig = getIdConfig();
      if (!idConfig) {
        setError("Không tìm thấy config_id. Vui lòng chọn website trước.");
        setLoading(false);
        return;
      }

      try {
        const fetchedMessages = await fetchConversationDetail(sessionId, idConfig);
        setMessages(fetchedMessages);
      } catch (err) {
        setError("Không thể tải chi tiết cuộc trò chuyện.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [sessionId]);

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

  const getSenderLabel = (sender: string) => {
    switch (sender) {
      case "user":
        return "Khách hàng";
      case "bot":
        return "Bot";
      case "admin":
        return "Nhân viên";
      default:
        return sender;
    }
  };

  const renderRating = (ratingValue: string | null) => {
    const rating = ratingValue ? parseInt(ratingValue, 10) : null;
    if (rating === null || isNaN(rating)) {
        return <span className="text-muted-foreground text-sm">Chưa đánh giá</span>;
    }
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate("/conversations")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
            <p className="text-red-500">{error}</p>
        </div>
    );
  }

  const lastRatedMessage = [...messages].reverse().find(msg => msg.rating !== null);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/conversations")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết cuộc trò chuyện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.sender === "user" ? "" : "flex-row-reverse"}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getSenderIcon(msg.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${msg.sender === "user" ? "" : "items-end"}`}>
                    <span className="text-xs text-muted-foreground mb-1">
                      {getSenderLabel(msg.sender)} • {new Date(msg.timestamp).toLocaleTimeString("vi-VN")}
                    </span>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-md ${msg.sender === "user"
                          ? "bg-muted"
                          : msg.sender === "bot"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      }`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div>
                 <p className="text-sm text-muted-foreground">Session ID</p>
                 <p className="font-medium break-all">{sessionId}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Domain</p>
                 <p className="font-medium">{messages.length > 0 ? messages[0].domain : 'N/A'}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Bắt đầu</p>
                 <p className="font-medium">
                   {messages.length > 0 ? new Date(messages[0].timestamp).toLocaleString('vi-VN') : 'N/A'}
                 </p>
               </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle>Đánh giá</CardTitle>
              </CardHeader>
              <CardContent>
                {renderRating(lastRatedMessage ? lastRatedMessage.rating : null)}
              </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
