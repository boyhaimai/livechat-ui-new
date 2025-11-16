import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { WebsiteSelector } from "@/components/WebsiteSelector";
import { mockLivechatConfig } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Save } from "lucide-react";
import axios from "axios";

// Mảng cấu hình cho các vị trí của tiện ích
const positionOptions = [
  { name: "Trên cùng bên trái", value: "top-left" },
  { name: "Trên cùng bên phải", value: "top-right" },
  { name: "Dưới cùng bên trái", value: "bottom-left" },
  { name: "Dưới cùng bên phải", value: "bottom-right" },
];

// Giả lập API_BASE_URL và axios
const API_BASE_URL = "https://n8n.vazo.vn/api";

// Định nghĩa cấu trúc state cho thông tin tài khoản
const initialAccountState = {
  email: "admin@example.com", // Giả định email
  phoneNumber: "",
};

// Giả lập hàm lấy config_id
// Remove the mock getSelectedConfigId
// const getSelectedConfigId = () => "mock-id-123";

// Use real getter:
const getSelectedConfigId = () => {
  try {
    return localStorage.getItem("selectedConfigId") || "";
  } catch {
    return "";
  }
};

// Định nghĩa cấu trúc state cho rõ ràng hơn (giả định cho TypeScript)
// Dùng tên trường theo API: title, avatar, themeColor, welcomeMessage
const initialConfigState = {
  title: "", // Tên widget
  welcomeMessage: "", // Lời chào đầu
  avatar: "", // URL Avatar
  themeColor: "#0abfbc", // Màu chủ đạo
  textColor: "#ffffff", // Màu chữ
  historyEnabled: true, // Lưu lịch sử
  webhookUrl: "", // Webhook URL
  linkContact: "", // Link liên hệ
  position: "bottom-right", // Vị trí tiện ích
  embedCode: mockLivechatConfig.embedCode, // Giữ lại embedCode
  serverUrl: "", // Server URL
};

export default function Settings() {
  const [config, setConfig] = useState(initialConfigState);
  const [accountInfo, setAccountInfo] = useState(initialAccountState); // Thêm state cho thông tin tài khoản
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const applyFetchedConfig = (fetchedConfig) => {
    setConfig({
      ...initialConfigState,
      title: fetchedConfig.title || "",
      welcomeMessage: fetchedConfig.welcomeMessage || "",
      avatar: fetchedConfig.avatar
        ? fetchedConfig.avatar.startsWith("/uploads")
          ? `${API_BASE_URL}${fetchedConfig.avatar}`
          : fetchedConfig.avatar
        : "",
      themeColor: fetchedConfig.themeColor || "#0abfbc",
      textColor: fetchedConfig.textColor || "#ffffff",
      historyEnabled: fetchedConfig.historyEnabled === true,
      webhookUrl: fetchedConfig.webhookUrl || "",
      linkContact: fetchedConfig.linkContact || "",
      position: fetchedConfig.position || "bottom-right",
      serverUrl: fetchedConfig.serverUrl || "",
      embedCode: fetchedConfig.embedCode || initialConfigState.embedCode,
    });
  };

  const fetchAdminInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-admin-info`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setAccountInfo({
          email: response.data.admin.email || initialAccountState.email,
          phoneNumber: response.data.admin.phoneNumber || "",
        });
      } else {
        console.error("Không thể lấy thông tin admin:", response.data.message);
      }
    } catch (err) {
      console.error("Fetch admin info error:", err);
    }
  };

  const fetchConfig = async () => {
    setFetchLoading(true);
    setError("");

    try {
      const storedConfigId = getSelectedConfigId();
      if (!storedConfigId) {
        // Fallback: lấy danh sách websites, dùng cái đầu tiên nếu có
        const websitesRes = await axios.get(`${API_BASE_URL}/get-websites`, {
          withCredentials: true,
        });

        if (websitesRes.data?.success && websitesRes.data.websites?.length) {
          const first = websitesRes.data.websites[0];
          // optionally store this to localStorage for next time
          localStorage.setItem("selectedConfigId", first.config_id);
          // use that id
          const cfgRes = await axios.get(
            `${API_BASE_URL}/get-config-by-id?id_config=${encodeURIComponent(
              first.config_id
            )}`
          );
          if (cfgRes.data) applyFetchedConfig(cfgRes.data);
        } else {
          setError("Không tìm thấy config_id. Vui lòng chọn website.");
        }
        return;
      }

      // Call real API with real id_config
      const response = await axios.get(
        `${API_BASE_URL}/get-config-by-id?id_config=${encodeURIComponent(
          storedConfigId
        )}`,
        { withCredentials: true }
      );

      if (response.data) {
        applyFetchedConfig(response.data);
      } else {
        setError("Không thể tải cấu hình từ server.");
      }
    } catch (err) {
      console.error("Fetch config error:", err);
      setError(
        err.response?.data?.message ||
          "Không thể kết nối đến server hoặc tải dữ liệu thất bại."
      );
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAdminInfo(); // Gọi thêm hàm fetchAdminInfo
  }, []);

  const handleSave = async () => {
    setSaveLoading(true);
    setError("");

    try {
      const id_config = getSelectedConfigId();
      if (!id_config) {
        setError("Không tìm thấy ID config");
        return;
      }

      const formData = new FormData();

      formData.append("id_config", id_config);
      formData.append("themeColor", config.themeColor);
      formData.append("textColor", config.textColor);
      formData.append("title", config.title);
      formData.append("welcomeMessage", config.welcomeMessage);
      formData.append("position", config.position);
      formData.append(
        "historyEnabled",
        config.historyEnabled ? "true" : "false"
      );

      formData.append("serverUrl", config.serverUrl.trim());
      formData.append("webhookUrl", config.webhookUrl);
      formData.append("linkContact", config.linkContact || "");

      // avatar luôn phải append
      formData.append("avatar", config.avatar || "");

      const response = await axios.post(
        `${API_BASE_URL}/save-config`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast({
          title: "Đã lưu cấu hình",
          description: "Cấu hình đã được cập nhật!",
        });
      } else {
        setError(response.data.message || "Lưu cấu hình thất bại.");
      }
    } catch (err) {
      console.error("Save config error:", err);
      setError("Lỗi kết nối khi lưu cấu hình.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleHistoryToggle = (checked) => {
    setConfig({ ...config, historyEnabled: checked });
  };

  const handlePositionChange = (value) => {
    setConfig({ ...config, position: value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span className="text-lg">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cấu hình</h1>
          <p className="text-muted-foreground">
            Tùy chỉnh giao diện và cài đặt livechat
          </p>
        </div>
        <WebsiteSelector />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="appearance">Giao diện</TabsTrigger>
          <TabsTrigger value="embed">Mã nhúng</TabsTrigger>
          <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giao diện Livechat</CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện hiển thị trên website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tên widget (title) */}
              <div className="space-y-2">
                <Label htmlFor="title">Tên widget</Label>
                <Input
                  id="title"
                  name="title"
                  value={config.title}
                  onChange={handleChange}
                />
              </div>

              {/* Lời chào đầu / Tin nhắn chào mừng (welcomeMessage) */}
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Tin nhắn chào mừng</Label>
                <Textarea
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Avatar (avatar) */}
              <div className="space-y-2">
                <Label>Avatar (URL)</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={config.avatar} />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <Input
                    placeholder="URL avatar"
                    name="avatar"
                    value={config.avatar}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  *Tính năng tải ảnh lên và cắt ảnh (crop) sẽ được bổ sung sau.
                  Hiện tại chỉ hỗ trợ URL.
                </p>
              </div>

              {/* Màu chủ đạo / Theme Color (themeColor) */}
              <div className="space-y-2">
                <Label htmlFor="themeColor">Màu chủ đạo</Label>
                <div className="flex gap-2">
                  <Input
                    id="themeColor"
                    type="color"
                    name="themeColor"
                    value={config.themeColor}
                    onChange={handleChange}
                    className="w-20 h-10"
                  />
                  <Input
                    name="themeColor"
                    value={config.themeColor}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Màu chữ / Text Color (textColor) */}
              <div className="space-y-2">
                <Label htmlFor="textColor">Màu chữ</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    name="textColor"
                    value={config.textColor}
                    onChange={handleChange}
                    className="w-20 h-10"
                  />
                  <Input
                    name="textColor"
                    value={config.textColor}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Vị trí tiện ích (position) */}
              <div className="space-y-2">
                <Label htmlFor="position">Vị trí tiện ích</Label>
                <Select
                  value={config.position}
                  onValueChange={handlePositionChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lưu lịch sử (historyEnabled) */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Lưu lịch sử trò chuyện</Label>
                  <CardDescription>
                    Bật/tắt tính năng lưu lại các cuộc trò chuyện với người
                    dùng.
                  </CardDescription>
                </div>
                <Switch
                  checked={config.historyEnabled}
                  onCheckedChange={handleHistoryToggle}
                />
              </div>

              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Mã nhúng</CardTitle>
              <CardDescription>
                Sao chép mã này và dán vào website của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mã livechat</Label>
                <div className="flex gap-2">
                  {/* Mã nhúng sử dụng serverUrl và config_id */}
                  <Input
                    value={`<script src="https://cdn.jsdelivr.net/gh/boyhaimai/model_admin_just_chat_v19@main/dist/model_admin_just_chat.js" data-server-url="${
                      config.serverUrl
                    }" data-id-config="${getSelectedConfigId()}" defer></script>`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      const embedCode = `<script src="https://cdn.jsdelivr.net/gh/boyhaimai/model_admin_just_chat_v19@main/dist/model_admin_just_chat.js" data-server-url="${
                        config.serverUrl
                      }" data-id-config="${getSelectedConfigId()}" defer></script>`;
                      navigator.clipboard.writeText(embedCode);
                      toast({
                        title: "Đã sao chép",
                        description: "Mã nhúng đã được sao chép vào clipboard",
                      });
                    }}
                  >
                    Sao chép
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Hướng dẫn:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Sao chép mã nhúng ở trên</li>
                  <li>
                    Dán vào phần {"<head>"} hoặc {"<body>"} của website
                  </li>
                  <li>Livechat sẽ tự động xuất hiện trên website</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Nâng cao */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Nâng cao</CardTitle>
              <CardDescription>
                Cấu hình các tính năng tích hợp và nâng cao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  name="webhookUrl"
                  placeholder="https://your-webhook-url.com"
                  value={config.webhookUrl}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  URL để kết nối với server xử lý tin nhắn (bắt buộc nếu không
                  dùng WebSocket).
                </p>
              </div>

              {/* Server URL */}
              <div className="space-y-2">
                <Label htmlFor="serverUrl">Server URL</Label>
                <Input
                  id="serverUrl"
                  name="serverUrl"
                  placeholder="https://n8n.vazo.vn/api"
                  value={config.serverUrl}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  URL server để đồng bộ dữ liệu.
                </p>
              </div>

              {/* Link liên hệ */}
              <div className="space-y-2">
                <Label htmlFor="linkContact">Link liên hệ</Label>
                <Input
                  id="linkContact"
                  name="linkContact"
                  placeholder="https://your-contact-page.com"
                  value={config.linkContact}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  Liên kết để người dùng gửi yêu cầu liên hệ khi cần.
                </p>
              </div>

              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt tài khoản</CardTitle>
              <CardDescription>
                Quản lý thông tin tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
	              <div className="space-y-2">
	                <Label>Số điện thoại</Label>
	                <Input value={accountInfo.phoneNumber || "Chưa cập nhật"} disabled />
	              </div>
              <div>
                <Link to="/change-password">
                  <Button variant="outline">Đổi mật khẩu</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
