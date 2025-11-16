// Mock data for livechat management system

export interface Website {
  id: string;
  name: string;
  domain: string;
  livechatCode: string;
  isActive: boolean;
}

export interface Conversation {
  id: string;
  websiteId: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'resolved' | 'pending';
  rating?: number;
  ratingComment?: string;
  startTime: string;
  endTime?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'bot' | 'agent';
  content: string;
  timestamp: string;
}

export interface Stats {
  visitors: number;
  totalConversations: number;
  unresolvedConversations: number;
  resolvedConversations: number;
}

export interface ChartData {
  date: string;
  conversations: number;
  resolved: number;
}

export interface LivechatConfig {
  websiteId: string;
  name: string;
  greeting: string;
  avatarUrl: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  embedCode: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'blocked' | 'expired';
  subscriptionEnd: string;
  createdAt: string;
  lastLogin: string;
  currentDevice?: string;
  currentPage?: string;
  isOnline: boolean;
}

export const mockWebsites: Website[] = [
  {
    id: 'web-1',
    name: 'Website chính',
    domain: 'example.com',
    livechatCode: 'LC-001-ABC123',
    isActive: true,
  },
  {
    id: 'web-2',
    name: 'Shop online',
    domain: 'shop.example.com',
    livechatCode: 'LC-002-DEF456',
    isActive: true,
  },
  {
    id: 'web-3',
    name: 'Blog',
    domain: 'blog.example.com',
    livechatCode: 'LC-003-GHI789',
    isActive: false,
  },
];

export const mockStats: Stats = {
  visitors: 1247,
  totalConversations: 89,
  unresolvedConversations: 12,
  resolvedConversations: 77,
};

export const mockChartData: ChartData[] = [
  { date: '2024-01-08', conversations: 45, resolved: 40 },
  { date: '2024-01-09', conversations: 52, resolved: 48 },
  { date: '2024-01-10', conversations: 38, resolved: 35 },
  { date: '2024-01-11', conversations: 61, resolved: 58 },
  { date: '2024-01-12', conversations: 49, resolved: 45 },
  { date: '2024-01-13', conversations: 71, resolved: 68 },
  { date: '2024-01-14', conversations: 89, resolved: 77 },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    websiteId: 'web-1',
    customerName: 'Nguyễn Văn A',
    customerEmail: 'nguyenvana@email.com',
    status: 'active',
    startTime: '2024-01-14T10:30:00',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    websiteId: 'web-1',
    customerName: 'Trần Thị B',
    customerEmail: 'tranthib@email.com',
    status: 'pending',
    startTime: '2024-01-14T09:15:00',
    unreadCount: 5,
  },
  {
    id: 'conv-3',
    websiteId: 'web-1',
    customerName: 'Lê Văn C',
    customerEmail: 'levanc@email.com',
    status: 'resolved',
    rating: 5,
    ratingComment: 'Hỗ trợ rất tốt, cảm ơn!',
    startTime: '2024-01-14T08:00:00',
    endTime: '2024-01-14T08:45:00',
    unreadCount: 0,
  },
  {
    id: 'conv-4',
    websiteId: 'web-2',
    customerName: 'Phạm Thị D',
    customerEmail: 'phamthid@email.com',
    status: 'resolved',
    rating: 4,
    startTime: '2024-01-13T15:20:00',
    endTime: '2024-01-13T16:00:00',
    unreadCount: 0,
  },
];

export const mockMessages: { [key: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      sender: 'customer',
      content: 'Xin chào, tôi cần hỗ trợ về sản phẩm',
      timestamp: '2024-01-14T10:30:00',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      sender: 'bot',
      content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      timestamp: '2024-01-14T10:30:15',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      sender: 'customer',
      content: 'Sản phẩm X có còn hàng không?',
      timestamp: '2024-01-14T10:31:00',
    },
  ],
  'conv-2': [
    {
      id: 'msg-4',
      conversationId: 'conv-2',
      sender: 'customer',
      content: 'Tôi muốn đổi trả hàng',
      timestamp: '2024-01-14T09:15:00',
    },
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      sender: 'bot',
      content: 'Tôi sẽ kết nối bạn với nhân viên hỗ trợ',
      timestamp: '2024-01-14T09:15:30',
    },
  ],
  'conv-3': [
    {
      id: 'msg-6',
      conversationId: 'conv-3',
      sender: 'customer',
      content: 'Làm sao để thanh toán online?',
      timestamp: '2024-01-14T08:00:00',
    },
    {
      id: 'msg-7',
      conversationId: 'conv-3',
      sender: 'bot',
      content: 'Bạn có thể thanh toán qua các phương thức: Thẻ ATM, Ví điện tử, hoặc COD',
      timestamp: '2024-01-14T08:00:30',
    },
    {
      id: 'msg-8',
      conversationId: 'conv-3',
      sender: 'customer',
      content: 'Cảm ơn bạn!',
      timestamp: '2024-01-14T08:45:00',
    },
  ],
};

export const mockLivechatConfig: LivechatConfig = {
  websiteId: 'web-1',
  name: 'Trợ lý ảo',
  greeting: 'Xin chào! Tôi có thể giúp gì cho bạn?',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=livechat',
  primaryColor: '#3b82f6',
  position: 'bottom-right',
  embedCode: `<script src="https://cdn.livechat.com/livechat-LC-001-ABC123.js"></script>`,
};

export const mockUsers: UserAccount[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Nguyễn Văn Admin',
    role: 'admin',
    status: 'active',
    subscriptionEnd: '2025-12-31',
    createdAt: '2024-01-15',
    lastLogin: '2025-11-14T10:30:00',
    currentDevice: 'Chrome on Windows',
    currentPage: '/dashboard',
    isOnline: true,
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Trần Thị Manager',
    role: 'moderator',
    status: 'active',
    subscriptionEnd: '2025-06-30',
    createdAt: '2024-03-20',
    lastLogin: '2025-11-14T09:15:00',
    currentDevice: 'Safari on MacOS',
    currentPage: '/conversations',
    isOnline: true,
  },
  {
    id: '3',
    email: 'user1@example.com',
    name: 'Lê Văn User',
    role: 'user',
    status: 'active',
    subscriptionEnd: '2025-03-31',
    createdAt: '2024-06-10',
    lastLogin: '2025-11-13T16:45:00',
    isOnline: false,
  },
  {
    id: '4',
    email: 'blocked@example.com',
    name: 'Phạm Thị Blocked',
    role: 'user',
    status: 'blocked',
    subscriptionEnd: '2025-02-28',
    createdAt: '2024-08-05',
    lastLogin: '2025-11-10T14:20:00',
    isOnline: false,
  },
  {
    id: '5',
    email: 'expired@example.com',
    name: 'Hoàng Văn Expired',
    role: 'user',
    status: 'expired',
    subscriptionEnd: '2025-01-15',
    createdAt: '2024-02-28',
    lastLogin: '2025-11-05T11:30:00',
    isOnline: false,
  },
];
