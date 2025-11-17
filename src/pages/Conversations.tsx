import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebsiteSelector } from "@/components/WebsiteSelector";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "https://n8n.vazo.vn";

// Định nghĩa kiểu dữ liệu cho tin nhắn thô từ API
interface RawMessage {
  sessionId: string;
  timestamp: string;
  message: string;
  sender: "bot" | "user" | "admin";
  domain: string;
  rating: string | null;
  isRead: boolean; // ⭐ Thêm dòng này
}

// Định nghĩa kiểu dữ liệu cho hội thoại đã được nhóm
interface Conversation {
  sessionId: string;
  customerName: string; // Giả định tên khách hàng là tin nhắn đầu tiên của user
  customerEmail: string; // Giả định email là domain
  status: "active" | "pending" | "resolved"; // Giả định tạm thời
  rating: number | null;
  startTime: string;
  unreadCount: number; // Giả định tạm thời
  lastMessageTime: string;
}

// Hàm lấy idConfig (mô phỏng từ DetailConversation.js)
const getIdConfig = (): string | null => {
  return localStorage.getItem("selectedConfigId");
};

// Hàm gọi API lấy lịch sử tin nhắn
const fetchHistory = async (idConfig: string): Promise<RawMessage[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/get-history-admin`, {
      params: {
        id_config: idConfig,
        limit: 1000, // Lấy đủ tin nhắn để nhóm
      },
      withCredentials: true,
    });

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Lỗi khi lấy lịch sử hội thoại."
      );
    }

    return response.data.messages as RawMessage[];
  } catch (error) {
    console.error("Lỗi khi gọi API lịch sử hội thoại:", error);
    throw error;
  }
};

// Hàm nhóm tin nhắn thành hội thoại
const groupMessagesToConversations = (
  messages: RawMessage[]
): Conversation[] => {
  const sessionsMap = new Map<string, RawMessage[]>();

  // 1. Nhóm tin nhắn theo sessionId
  messages.forEach((msg) => {
    if (!sessionsMap.has(msg.sessionId)) {
      sessionsMap.set(msg.sessionId, []);
    }
    sessionsMap.get(msg.sessionId)?.push(msg);
  });

  const conversations: Conversation[] = [];

  // 2. Xử lý từng session
  sessionsMap.forEach((sessionMessages, sessionId) => {
    // Sắp xếp tin nhắn theo thời gian
    sessionMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstMessage = sessionMessages[0];
    const lastMessage = sessionMessages[sessionMessages.length - 1];

    // Tìm tin nhắn đầu tiên của user để làm "customerName"
    const firstUserMessage = sessionMessages.find(
      (msg) => msg.sender === "user"
    );

    // Tìm rating cuối cùng
    const lastRatedMessage = [...sessionMessages]
      .reverse()
      .find((msg) => msg.rating !== null);
    const rating = lastRatedMessage
      ? parseInt(lastRatedMessage.rating as string, 10)
      : null;

    // ⭐ Tính số tin nhắn chưa đọc
    const unreadCount = sessionMessages.filter((msg) => !msg.isRead).length;

    conversations.push({
      sessionId: sessionId,
      customerName: firstUserMessage
        ? firstUserMessage.message
        : "Khách hàng ẩn danh",
      customerEmail: firstMessage.domain, // tạm dùng domain
      status: "resolved", // giả định
      rating: rating,
      startTime: firstMessage.timestamp,
      unreadCount: unreadCount,
      lastMessageTime: lastMessage.timestamp,
    });
  });

  // Sắp xếp hội thoại theo thời gian tin nhắn cuối cùng
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessageTime).getTime() -
      new Date(a.lastMessageTime).getTime()
  );

  return conversations;
};

export default function Conversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setError(null);

      const idConfig = getIdConfig();
      if (!idConfig) {
        setError("Không tìm thấy config_id. Vui lòng chọn website trước.");
        setLoading(false);
        return;
      }

      try {
        const rawMessages = await fetchHistory(idConfig);
        const groupedConversations = groupMessagesToConversations(rawMessages);
        setConversations(groupedConversations);
      } catch (err) {
        setError("Không thể tải danh sách cuộc trò chuyện.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, label: "Đang hoạt động" },
      pending: { variant: "secondary" as const, label: "Chờ xử lý" },
      resolved: { variant: "outline" as const, label: "Đã giải quyết" },
    };
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderRating = (rating: number | null) => {
    if (!rating)
      return (
        <span className="text-muted-foreground text-sm">Chưa đánh giá</span>
      );
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* <CircularProgress /> */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const handleOpenConversation = async (sessionId: string) => {
    try {
      // Gọi API đánh dấu tất cả tin nhắn trong session là đã đọc
      await axios.post(
        `${API_BASE_URL}/api/mark-messages-read`,
        { sessionId },
        { withCredentials: true }
      );

      // Cập nhật state ngay lập tức để badge "Chưa đọc" biến mất
      setConversations((prev) =>
        prev.map((conv) =>
          conv.sessionId === sessionId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Điều hướng sang trang chi tiết
      navigate(`/conversations/${sessionId}`);
    } catch (err) {
      console.error("Không thể đánh dấu đã đọc:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuộc trò chuyện</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả cuộc trò chuyện với khách hàng
          </p>
        </div>
        <WebsiteSelector />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách cuộc trò chuyện</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Chưa đọc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conv) => (
                <TableRow
                  key={conv.sessionId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleOpenConversation(conv.sessionId)}
                >
                  <TableCell className="font-medium">Ẩn danh</TableCell>
                  <TableCell>{conv.customerEmail}</TableCell>
                  <TableCell>{getStatusBadge(conv.status)}</TableCell>
                  <TableCell>{renderRating(conv.rating)}</TableCell>
                  <TableCell>
                    {new Date(conv.lastMessageTime).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    {conv.unreadCount > 0 ? (
                      <Badge variant="destructive">{conv.unreadCount}</Badge>
                    ) : (
                      <span>Đã xem</span> // hoặc để trống
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
