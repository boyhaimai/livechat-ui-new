import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  MessageCircle,
  LogOut,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

const baseMenu = [
  { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboard },
  { title: "Cuộc trò chuyện", url: "/conversations", icon: MessageSquare },
  { title: "Chat trực tiếp", url: "/livechat", icon: MessageCircle },
  { title: "Cấu hình", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const userRole = localStorage.getItem("userRole");

  // 👉 Thêm menu condition
  const menuItems =
    userRole === "admin"
      ? [...baseMenu, { title: "Quản lý tài khoản", url: "/users", icon: Users }]
      : baseMenu;

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "https://n8n.vazo.vn/api/logout",
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        document.cookie =
          "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        localStorage.removeItem("userRole");
        localStorage.removeItem("selectedConfigId");

        toast({
          title: "Đăng xuất thành công",
          description: "Hẹn gặp lại bạn!",
        });
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      toast({
        title: "Lỗi",
        description: "Đăng xuất thất bại. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý Livechat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog
              open={isLogoutDialogOpen}
              onOpenChange={setIsLogoutDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <SidebarMenuButton className="text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span>Đăng xuất</span>}
                </SidebarMenuButton>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setIsLogoutDialogOpen(false)}
                  >
                    Hủy
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setIsLogoutDialogOpen(false);
                      handleLogout();
                    }}
                  >
                    Đăng xuất
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
