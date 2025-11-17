import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
// Giả định API_BASE_URL được định nghĩa ở đâu đó, nếu không có, cần thêm vào.
// Ví dụ: const API_BASE_URL = "https://n8n.vazo.vn";
// Nếu API_BASE_URL được import từ một file config, hãy import nó.
// Hiện tại, tôi sẽ sử dụng một biến giả định.
const API_BASE_URL = "https://n8n.vazo.vn"; // Cần thay thế bằng URL thực tế của bạn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // Thêm state cho phoneNumber
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState(""); // Thêm state cho lỗi server
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    // Thêm validation cho tên và số điện thoại theo logic từ Register_admin.js
    const phoneRegex = /^0\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      toast({
        title: "Lỗi",
        description: "Số điện thoại phải có đúng 10 số và bắt đầu bằng 0.",
        variant: "destructive",
      });
      return;
    }
    if (!name || name.trim().length < 2) {
      toast({
        title: "Lỗi",
        description: "Tên phải có ít nhất 2 ký tự.",
        variant: "destructive",
      });
      return;
    }
    // Thêm validation mật khẩu tối thiểu 6 ký tự
    if (password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự.",
        variant: "destructive",
      });
      return;
    }

    setServerError(""); // Xóa lỗi cũ

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/register-admin`, // Sử dụng endpoint từ Register_admin.js
        {
          name: name,
          phoneNumber: phoneNumber, // Sử dụng phoneNumber thay vì email
          password: password,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Đăng ký thành công",
          description: "Tài khoản của bạn đã được tạo!",
        });
        // Chuyển hướng đến /add_website như trong Register_admin.js
        setTimeout(() => navigate("/add_website"), 1000);
      } else {
        setServerError(response.data.message || "Đăng ký thất bại.");
        toast({
          title: "Lỗi",
          description: response.data.message || "Đăng ký thất bại.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Không thể kết nối đến server.";
      setServerError(errorMessage);
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản để bắt đầu quản lý livechat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {serverError && (
              <div className="text-sm font-medium text-destructive">{serverError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                type="tel" // Thay đổi type thành tel
                placeholder="0901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10" // Thêm padding bên phải cho icon
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10" // Thêm padding bên phải cho icon
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Đăng ký
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
