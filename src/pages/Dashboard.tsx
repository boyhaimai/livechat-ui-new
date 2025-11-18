import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { Check, Globe, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const API_BASE_URL = "https://n8n.vazo.vn"; // Thay đổi URL cơ sở API nếu cần

// Hàm chuyển đổi dữ liệu dailyVisitors sang định dạng biểu đồ
const transformChartData = (dailyVisitors) => {
  if (!dailyVisitors || dailyVisitors.length === 0) return [];
  return dailyVisitors.map((item) => ({
    date: item.date,
    visitors: item.count,
    // Giả sử không có dữ liệu conversations trong dailyVisitors,
    // nếu cần thì phải lấy từ API khác hoặc tính toán.
    // Tạm thời chỉ dùng visitors.
  }));
};

export default function Dashboard() {
  const [websites, setWebsites] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: "", domain: "" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State cho dialog sửa
  const [websiteToEdit, setWebsiteToEdit] = useState(null); // Website đang được sửa
  const [editedWebsite, setEditedWebsite] = useState({ name: "", domain: "" }); // Dữ liệu đang sửa
  const [websiteToDelete, setWebsiteToDelete] = useState(null);
  // const { toast } = useToast(); // Đã chuyển lên trên để dùng chung
  const { toast } = useToast();
  const navigate = useNavigate();
  // Hàm xử lý lỗi hết token
  const handleTokenExpired = (error) => {
    if (error.response && error.response.status === 401) {
      toast({
        title: "Phiên làm việc hết hạn",
        description: "Token đã hết hạn. Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      // Xóa token hoặc thông tin đăng nhập khỏi localStorage/sessionStorage nếu có
      localStorage.removeItem("selectedConfigId"); // Ví dụ: xóa configId đã lưu
      // Chuyển hướng về trang đăng nhập
      navigate("/login"); // Giả sử trang đăng nhập là /login
      return true; // Đã xử lý lỗi
    }
    return false; // Chưa xử lý lỗi
  };

  const selectedWebsite = useMemo(() => {
    if (!selectedConfigId || !websites) return null;
    return websites.find((w) => w.config_id === selectedConfigId);
  }, [selectedConfigId, websites]);

  const fetchWebsites = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/get-websites`, {
        withCredentials: true,
      });

      if (response.data.success) {
        const websitesList = response.data.websites;
        setWebsites(websitesList);

        let configId = localStorage.getItem("selectedConfigId");

        if (websitesList.length === 0) {
          setError("Không có website nào. Vui lòng thêm website mới.");
          setLoading(false);
          return;
        }

        if (!configId || !websitesList.some((w) => w.config_id === configId)) {
          // Nếu không có configId trong localStorage hoặc configId không hợp lệ,
          // chọn website đầu tiên (hoặc website duy nhất)
          configId = websitesList[0].config_id;
          localStorage.setItem("selectedConfigId", configId);
        }

        setSelectedConfigId(configId);
        fetchStats(configId);
      } else {
        setError("Không thể tải danh sách website.");
        setLoading(false);
      }
    } catch (err) {
      if (handleTokenExpired(err)) {
        return;
      }
      console.error("Lỗi tải website:", err);
      setError("Lỗi kết nối server khi tải website.");
      setLoading(false);
    }
  };

  const fetchStats = async (configId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/get-stats?config_id=${configId}`,
        {
          withCredentials: true,
        }
      );

      console.log("📌 Backend trả về stats:", response.data);

      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError("Không thể tải dữ liệu thống kê.");
      }
    } catch (err) {
      if (handleTokenExpired(err)) {
        return;
      }
      console.error("Lỗi tải thống kê:", err);
      setError("Lỗi kết nối server khi tải thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleWebsiteSelect = (website) => {
    localStorage.setItem("selectedConfigId", website.config_id);
    setSelectedConfigId(website.config_id);
    fetchStats(website.config_id);
  };

  const handleEditClick = (website) => {
    setWebsiteToEdit(website);
    setEditedWebsite({
      name: website.name_website || "",
      domain: website.domain || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditWebsite = async () => {
    if (!websiteToEdit || !editedWebsite.name || !editedWebsite.domain) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/update-website`,
        {
          websiteId: websiteToEdit.id,
          name: editedWebsite.name,
          domain: editedWebsite.domain,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Thành công",
          description: `Website "${editedWebsite.name}" đã được cập nhật.`,
        });
        // Cập nhật danh sách website
        fetchWebsites();
      } else {
        toast({
          title: "Lỗi",
          description: response.data.message || "Không thể cập nhật website.",
          variant: "destructive",
        });
      }
    } catch (err) {
      if (handleTokenExpired(err)) {
        return;
      }
      console.error("Lỗi cập nhật website:", err);
      toast({
        title: "Lỗi kết nối",
        description: "Lỗi server khi cập nhật website.",
        variant: "destructive",
      });
    } finally {
      setIsEditDialogOpen(false);
      setWebsiteToEdit(null);
    }
  };

  const handleDeleteWebsite = async () => {
    if (!websiteToDelete) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/delete-website`,
        { websiteId: websiteToDelete.id }, // API backend yêu cầu websiteId
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Thành công",
          description: `Website "${websiteToDelete.domain}" đã được xóa.`,
        });
        // Cập nhật danh sách website
        fetchWebsites();
      } else {
        toast({
          title: "Lỗi",
          description: response.data.message || "Không thể xóa website.",
          variant: "destructive",
        });
      }
    } catch (err) {
      if (handleTokenExpired(err)) {
        return;
      }
      console.error("Lỗi xóa website:", err);
      toast({
        title: "Lỗi kết nối",
        description: "Lỗi server khi xóa website.",
        variant: "destructive",
      });
    } finally {
      // AlertDialog không cần đóng ở đây vì nó được đóng bởi AlertDialogAction/Cancel
      // Tuy nhiên, ta vẫn cần reset websiteToDelete
      setWebsiteToDelete(null);
    }
  };

  const handleAddWebsite = () => {
    // Logic thêm website (chưa được cung cấp API)
    if (!newWebsite.name || !newWebsite.domain) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    // Giả lập thêm website thành công và reload
    toast({
      title: "Thêm website thành công",
      description: `Đã thêm ${newWebsite.name}. Vui lòng tải lại trang để cập nhật.`,
    });

    setIsDialogOpen(false);
    setNewWebsite({ name: "", domain: "" });
    // Trong thực tế, bạn sẽ gọi API thêm website ở đây, sau đó gọi fetchWebsites()
    // Tạm thời, tôi sẽ chỉ đóng dialog.
  };

  const displayStats = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: "Khách truy cập hôm nay",
        value: stats.visitorsToday,
        icon: Users,
        description: `Tổng tháng: ${stats.visitorsThisMonth}`,
      },
      {
        title: "Lượt xem trang hôm nay",
        value: stats.pageViewsToday,
        icon: MessageSquare,
        description: `Tổng tháng: ${stats.pageViewsThisMonth}`,
      },
      {
        title: "Cuộc trò chuyện đã trả lời",
        value: stats.conversationsAnswered,
        icon: CheckCircle,
        description: `Bỏ lỡ: ${stats.conversationsMissed}`,
      },
      {
        title: "Tổng khách 7 ngày",
        value: stats.visitorsLast7Days,
        icon: Clock,
        description: `Tổng lượt xem 7 ngày: ${stats.pageViewsLast7Days}`,
      },
    ];
  }, [stats]);

  const chartData = useMemo(() => {
    if (!stats) return [];

    const visitors = stats.dailyVisitors || [];
    const conversations = stats.dailyConversations || [];

    return visitors.map((item, idx) => ({
      date: item.date,
      "Khách truy cập": item.count,
      "Cuộc chat": conversations[idx]?.count || 0,
    }));
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className="p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded">
        <p className="font-semibold">Chưa có website nào.</p>
        <p>Vui lòng thêm website để tiếp tục sử dụng hệ thống.</p>

        <Button
          onClick={() => navigate("/add-web")}
          className="mt-4 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm website
        </Button>
      </div>
    );
  }

  if (!selectedWebsite) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p>Vui lòng thêm website mới để bắt đầu thống kê.</p>
        <Button onClick={() => navigate("/add-web")} className="mt-2">
          <Plus className="h-4 w-4 mr-2" /> Thêm website
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {/* Dialog content here */}
        </Dialog>
      </div>
    );
  }

	  return (
	    <div className="space-y-6">
	      {/* Dialog sửa website */}
	      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
	        <DialogContent className="sm:max-w-[425px]">
	          <DialogHeader>
	            <DialogTitle>Sửa thông tin Website</DialogTitle>
	            <DialogDescription>
	              Chỉnh sửa tên và domain của website. Nhấn lưu khi hoàn tất.
	            </DialogDescription>
	          </DialogHeader>
	          <div className="grid gap-4 py-4">
	            <div className="grid grid-cols-4 items-center gap-4">
	              <Label htmlFor="name" className="text-right">
	                Tên Website
	              </Label>
	              <Input
	                id="name"
	                value={editedWebsite.name}
	                onChange={(e) =>
	                  setEditedWebsite({ ...editedWebsite, name: e.target.value })
	                }
	                className="col-span-3"
	              />
	            </div>
	            <div className="grid grid-cols-4 items-center gap-4">
	              <Label htmlFor="domain" className="text-right">
	                Domain
	              </Label>
	              <Input
	                id="domain"
	                value={editedWebsite.domain}
	                onChange={(e) =>
	                  setEditedWebsite({ ...editedWebsite, domain: e.target.value })
	                }
	                className="col-span-3"
	              />
	            </div>
	          </div>
	          <DialogFooter>
	            <Button type="submit" onClick={handleEditWebsite}>
	              Lưu thay đổi
	            </Button>
	          </DialogFooter>
	        </DialogContent>
	      </Dialog>
	      {/* Kết thúc Dialog sửa website */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground">Thống kê hoạt động livechat</p>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Globe className="h-4 w-4" />
                <div className="flex flex-col max-w-[150px] truncate text-left mr-auto">
                  <span className="font-medium text-sm truncate">
                    {selectedWebsite.name_website || "No name"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {selectedWebsite.domain}
                  </span>
                </div>

                <Badge variant="default" className="ml-4">
                  Đã chọn
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              {websites.map((website) => (
                <DropdownMenuItem
                  key={website.id}
                  className="flex items-center justify-between p-0"
                >
                  <div
                    onClick={() => handleWebsiteSelect(website)}
                    className="flex flex-col p-2 w-full cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium">
                      {website.name_website || "No name"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {website.domain}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {selectedConfigId === website.config_id && (
                      <Check className="h-4 w-4 text-primary mr-2" />
                    )}
                    {/* Icon sửa */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn chặn việc chọn website khi click nút sửa
                        handleEditClick(website);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* Icon xóa */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn chặn việc chọn website khi click nút xóa
                        setWebsiteToDelete(website);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />`{" "}
              <DropdownMenuItem
                onClick={() => navigate("/add-web")}
                className="text-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm website
              </DropdownMenuItem>
              `
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AlertDialog xác nhận xóa website */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa website</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa website{" "}
                  <strong>{websiteToDelete?.domain}</strong> không? Hành động
                  này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteWebsite}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ thống kê 7 ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString("vi-VN")
                }
              />
              <Legend />
              <Bar
                dataKey="Khách truy cập"
                fill="hsl(var(--primary))"
                name="Khách truy cập"
              />
              <Bar dataKey="Cuộc chat" fill="#21C45D" name="Cuộc chat" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
