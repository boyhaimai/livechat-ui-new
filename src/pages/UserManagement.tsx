import { useEffect, useState, type ElementType } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Calendar,
  Shield,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  LockOpen,
  UserCheck,
  Users,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const API_BASE_URL = "https://n8n.vazo.vn";

export interface AdminUserAccount {
  id: string;
  name_customer: string;
  phone: string;
  role: "admin" | "user";
  created_at: string;
  expire_at: string;
  is_ban: "true" | "false";
  isOnline?: boolean;
  currentDevice?: string;
  currentPage?: string;
  email?: string;
}

export interface AdminStats {
  total_accounts: number;
  total_admin: number;
  total_user: number;
  total_banned: number;
}

export interface AdminDataResponse {
  accounts: AdminUserAccount[];
  total_accounts: number;
  total_admin: number;
  total_user: number;
  total_banned: number;
}

const fetchAdminData = async (
  page: number = 0,
  limit: number = 10,
  searchTerm: string = ""
): Promise<AdminDataResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/admin-info`, {
      params: { page, limit, search: searchTerm },
      withCredentials: true,
    });

    const data = response.data?.[0]?.result;
    if (!data) {
      throw new Error("Dữ liệu trả về từ API không hợp lệ.");
    }
    if (data) {
      const accountsWithMockFields = data.accounts.map(
        (acc: AdminUserAccount) => ({
          ...acc,
          isOnline: Math.random() > 0.5,
          currentDevice: Math.random() > 0.7 ? "Desktop" : "Mobile",
          currentPage: Math.random() > 0.6 ? "/dashboard" : "/settings",
          email: `${acc.phone}@example.com`,
        })
      );

      return {
        accounts: accountsWithMockFields,
        total_accounts: data.total_accounts || 0,
        total_admin: data.total_admin || 0,
        total_user: data.total_user || 0,
        total_banned: data.total_banned || 0,
      };
    }
    return {
      accounts: [],
      total_accounts: 0,
      total_admin: 0,
      total_user: 0,
      total_banned: 0,
    };
  } catch (err) {
    console.error("Lỗi khi lấy admin info:", err);
    throw new Error("Không thể tải dữ liệu quản trị.");
  }
};

const setRole = async (id: string, role: "admin" | "user"): Promise<string> => {
  const res = await axios.post(
    `${API_BASE_URL}/api/api/admin/set-role`,
    { id, role },
    { withCredentials: true }
  );
  return res.data.message;
};

const deleteAccount = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/admin/delete-account/${id}`, {
    withCredentials: true,
  });
};

const extendExpire = async (id: string, label: string): Promise<string> => {
  const res = await axios.post(
    `${API_BASE_URL}/api/api/admin/extend-expire`,
    { id, label },
    { withCredentials: true }
  );
  return res.data.message;
};

// --- THAY THẾ: gửi boolean giống Admin.js ---
const setBan = async (id: string, is_ban: boolean): Promise<string> => {
  const res = await axios.post(
    `${API_BASE_URL}/api/api/admin/set-ban`,
    { id, is_ban }, // gửi boolean trực tiếp
    { withCredentials: true }
  );
  return is_ban ? "Đã chặn tài khoản" : "Đã bỏ chặn tài khoản";
};

const roleMap: Record<
  AdminUserAccount["role"],
  { label: string; icon: ElementType; color: string }
> = {
  admin: { label: "Admin", icon: Shield, color: "text-red-500" },
  user: { label: "User", icon: UserCheck, color: "text-blue-500" },
};

type UserAccount = AdminUserAccount;

const ROWS_PER_PAGE = 10;

export default function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isEditConfirmDialogOpen, setIsEditConfirmDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    name: "",
    role: "",
    password: "",
  });
  const [extendMonths, setExtendMonths] = useState("1");

  const [stats, setStats] = useState<AdminStats>({
    total_accounts: 0,
    total_admin: 0,
    total_user: 0,
    total_banned: 0,
  });
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<{
    id: string;
    role: "admin" | "user";
  } | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleRequest, setRoleRequest] = useState<{
    id: string;
    role: "admin" | "user";
    name: string;
  } | null>(null);

  const { toast } = useToast();

  const loadAdminData = async (
    currentPage: number,
    currentSearchTerm: string
  ) => {
    setIsLoading(true);
    try {
      const data = await fetchAdminData(
        currentPage,
        ROWS_PER_PAGE,
        currentSearchTerm
      );
      setUsers(data.accounts as UserAccount[]);
      setStats(data);
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải dữ liệu quản trị viên.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData(page, searchTerm);
  }, [page, searchTerm]);

  // --- THAY THẾ: useEffect xử lý pendingRole, kèm auto-extend khi chuyển về user ---
  useEffect(() => {
    if (!pendingRole) return;

    const updateRole = async () => {
      try {
        const message = await setRole(pendingRole.id, pendingRole.role);

        // Nếu chuyển từ admin => user, backend ở Admin.js dùng "2 tuần" để gia hạn 14 ngày
        if (pendingRole.role === "user") {
          try {
            await extendExpire(pendingRole.id, "2 tuần");
          } catch (err) {
            // Nếu lỗi gia hạn, vẫn proceed nhưng thông báo nhẹ
            toast({
              title: "Cảnh báo",
              description: "Quyền đã thay đổi nhưng không thể gia hạn 14 ngày.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Cập nhật quyền thành công",
          description: message,
        });

        loadAdminData(page, searchTerm);
      } catch (err) {
        toast({
          title: "Lỗi",
          description: "Lỗi khi cập nhật quyền!",
          variant: "destructive",
        });
      } finally {
        setPendingRole(null);
      }
    };

    updateRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRole]); // giữ dependency chỉ pendingRole để tránh gọi thừa

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || user.role === filterRole;

    let userStatus = "active";
    if (user.is_ban === "true") {
      userStatus = "blocked";
    } else if (
      user.expire_at !== "0" &&
      new Date(user.expire_at) < new Date()
    ) {
      userStatus = "expired";
    }

    const matchesStatus = filterStatus === "all" || userStatus === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditForm({
      phone: user.phone || "",
      name: user.name_customer,
      role: user.role,
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleRoleChange = (user: UserAccount) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setRoleRequest({ id: user.id, role: newRole, name: user.name_customer });
    setIsRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    if (roleRequest) {
      setPendingRole({ id: roleRequest.id, role: roleRequest.role });
      setIsRoleDialogOpen(false);
      setRoleRequest(null);
    }
  };

  const handleSaveEdit = () => {
    // Mở dialog xác nhận trước khi lưu
    setIsEditConfirmDialogOpen(true);
  };

  const handleConfirmSaveEdit = () => {
    if (selectedUser) {
      if (editForm.password) {
        console.log(
          `Đổi mật khẩu cho ${selectedUser.id}: ${editForm.password}`
        );
        toast({
          title: "Đổi mật khẩu thành công (Giả lập)",
          description: "Mật khẩu mới đã được ghi nhận.",
        });
      }

      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                name_customer: editForm.name,
                phone: editForm.phone,
                role: editForm.role as "admin" | "user",
              }
            : u
        )
      );

      toast({
        title: "Cập nhật thông tin thành công",
        description: `Thông tin người dùng ${selectedUser.name_customer} đã được cập nhật.`,
      });
      setIsEditDialogOpen(false);
      setIsEditConfirmDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteAccount(selectedUser.id);
        toast({
          title: "Xóa thành công",
          description: `Đã xóa người dùng ${selectedUser.name_customer}.`,
        });
        loadAdminData(page, searchTerm);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể xóa người dùng.",
          variant: "destructive",
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
      }
    }
  };

  // Mapping giống admin
  const convertExtendLabel = (months: string) => {
    switch (months) {
      case "1":
        return "1 tháng";
      case "3":
        return "3 tháng";
      case "6":
        return "6 tháng";
      case "12":
        return "1 năm";
      default:
        return "1 tháng";
    }
  };

  const handleConfirmExtend = async () => {
    if (!selectedUser) return;
    try {
      const label = convertExtendLabel(extendMonths);
      const message = await extendExpire(selectedUser.id, label);
      toast({
        title: "Gia hạn thành công",
        description: message,
      });
      loadAdminData(page, searchTerm);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gia hạn.",
        variant: "destructive",
      });
    } finally {
      setIsExtendDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleExtendExpire = (user: UserAccount) => {
    setSelectedUser(user);
    setIsExtendDialogOpen(true);
  };

  const handleToggleBan = (user: UserAccount) => {
    setSelectedUser(user);
    setIsBanDialogOpen(true);
  };

  const handleConfirmToggleBan = async () => {
    if (selectedUser) {
      try {
        const newBanStatus = selectedUser.is_ban === "false";
        const message = await setBan(selectedUser.id, newBanStatus);
        toast({
          title: "Cập nhật trạng thái thành công",
          description: message,
        });
        loadAdminData(page, searchTerm);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật trạng thái chặn.",
          variant: "destructive",
        });
      } finally {
        setIsBanDialogOpen(false);
        setSelectedUser(null);
      }
    }
  };

  const totalPages = Math.ceil(stats.total_accounts / ROWS_PER_PAGE);

  const getStatus = (user: UserAccount) => {
    if (user.is_ban === "true") {
      return { label: "Bị chặn", color: "destructive" as const };
    }
    if (user.expire_at !== "0") {
      const expireDate = new Date(user.expire_at);
      if (isNaN(expireDate.getTime())) {
        return { label: "N/A", color: "default" as const };
      }
      if (expireDate < new Date()) {
        return { label: "Hết hạn", color: "destructive" as const };
      }
    }
    return { label: "Hoạt động", color: "default" as const };
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng tài khoản
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_accounts}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số tài khoản trong hệ thống
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_admin}</div>
            <p className="text-xs text-muted-foreground">
              Tài khoản có quyền admin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_user}</div>
            <p className="text-xs text-muted-foreground">
              Tài khoản người dùng thường
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bị chặn</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_banned}</div>
            <p className="text-xs text-muted-foreground">
              Tài khoản bị vô hiệu hóa
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý người dùng</CardTitle>
          <CardDescription>
            Xem, chỉnh sửa, và quản lý tất cả tài khoản người dùng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, SĐT..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="expired">Hết hạn</SelectItem>
                  <SelectItem value="blocked">Bị chặn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Ngày hết hạn</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = roleMap[user.role].icon;
                  const roleColor = roleMap[user.role].color;
                  const status = getStatus(user);

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name_customer}
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${roleColor}`}>
                          <RoleIcon className="h-4 w-4" />
                          {roleMap[user.role].label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.expire_at === "0"
                          ? "Vĩnh viễn"
                          : new Date(user.expire_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {/* <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button> */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRoleChange(user)}
                          >
                            {user.role === "admin" ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleExtendExpire(user)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleBan(user)}
                          >
                            {user.is_ban === "true" ? (
                              <LockOpen className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị {page * ROWS_PER_PAGE + 1}-
              {Math.min((page + 1) * ROWS_PER_PAGE, stats.total_accounts)} trên{" "}
              {stats.total_accounts} người dùng
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span>
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog xác nhận chuyển quyền */}
      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi quyền</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn chuyển '{roleRequest?.name}' thành '
              {roleRequest?.role}'?
              {roleRequest?.role === "user" &&
                " Người này sẽ mất quyền admin và được gia hạn thêm 14 ngày."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRoleChange}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xác nhận xóa */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng '
              {selectedUser?.name_customer}'? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog chỉnh sửa */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin của {selectedUser?.name_customer}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Vai trò
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Mật khẩu mới
              </Label>
              <Input
                id="password"
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.target.value })
                }
                className="col-span-3"
                placeholder="Để trống nếu không đổi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveEdit}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận chỉnh sửa */}
      <AlertDialog
        open={isEditConfirmDialogOpen}
        onOpenChange={setIsEditConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu thay đổi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn lưu các thay đổi cho người dùng '
              {selectedUser?.name_customer}'?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsEditConfirmDialogOpen(false)}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveEdit}>
              Xác nhận lưu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xác nhận Block/Unblock */}
      <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xác nhận {selectedUser?.is_ban === "true" ? "Bỏ chặn" : "Chặn"}{" "}
              tài khoản
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn{" "}
              {selectedUser?.is_ban === "true" ? "bỏ chặn" : "chặn"} tài khoản '
              {selectedUser?.name_customer}'?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBanDialogOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggleBan}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog gia hạn */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gia hạn tài khoản</DialogTitle>
            <DialogDescription>
              Chọn thời gian để gia hạn cho '{selectedUser?.name_customer}'.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extend-months" className="text-right">
                Thời gian
              </Label>
              <Select value={extendMonths} onValueChange={setExtendMonths}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 tháng</SelectItem>
                  <SelectItem value="3">3 tháng</SelectItem>
                  <SelectItem value="6">6 tháng</SelectItem>
                  <SelectItem value="12">12 tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsExtendDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" onClick={handleConfirmExtend}>
              Gia hạn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
