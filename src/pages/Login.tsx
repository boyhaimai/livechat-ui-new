import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import GoogleLoginButton from "./loggin_gg"; // Import component mới
import { MessageSquare, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "../components/images/vazo.png";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    server?: string;
    phoneNumber?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Thêm state cho loading Google
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { phoneNumber?: string; password?: string } = {};
    const phoneRegex = /^\+?\d{10,15}$/; // Regex cho SĐT 10-15 chữ số, có thể có +

    // Kiểm tra số điện thoại
    if (!phoneNumber) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại.";
    } else if (!phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ.";
    }

    // Kiểm tra mật khẩu
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const API_BASE_URL = "https://n8n.vazo.vn/api"; // Cần thay đổi thành URL API thực tế

  // Hàm mã hóa/giải mã đơn giản (Base64) để đáp ứng yêu cầu "mã hóa pass"
  const encodeBase64 = (str: string) => btoa(str);
  const decodeBase64 = (str: string) => atob(str);

  useEffect(() => {
    // ✅ Kiểm tra login bằng COOKIE (đăng nhập thật)
    const checkCookieLogin = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/get-admin-info`, {
          withCredentials: true,
        });

        if (res.data.success && res.data.admin) {
          navigate("/dashboard");
          return; // QUAN TRỌNG
        }
      } catch (err) {
        console.log("Cookie không hợp lệ hoặc chưa đăng nhập");
      }
    };

    checkCookieLogin();

    // ✅ Kiểm tra login bằng token localStorage (cũ)
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/dashboard");
        return;
      }
    };

    checkAuth();

    // ❗ Logic Remember Me (giữ nguyên)
    const savedPhoneNumber = localStorage.getItem("rememberedPhoneNumber");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedPhoneNumber && savedPassword && savedRememberMe) {
      try {
        setPhoneNumber(savedPhoneNumber);
        setPassword(decodeBase64(savedPassword));
        setRememberMe(savedRememberMe);
      } catch (error) {
        console.error("Lỗi giải mã mật khẩu:", error);
        localStorage.removeItem("rememberedPhoneNumber");
        localStorage.removeItem("rememberedPassword");
        localStorage.removeItem("rememberMe");
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/login-admin`,
        { phoneNumber, password },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Giả định API trả về role, websites, và token (nếu không dùng cookie)
        localStorage.setItem("userRole", response.data.role || "admin");
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
          variant: "default",
        });

        // Logic chuyển hướng dựa trên websites (tương tự Login_admin.js)
        if (rememberMe) {
          localStorage.setItem("rememberedPhoneNumber", phoneNumber);
          localStorage.setItem("rememberedPassword", encodeBase64(password));
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedPhoneNumber");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("rememberMe");
        }

        if (response.data.websites && response.data.websites.length === 0) {
          navigate("/add-web"); // Giả định route này tồn tại
        } else {
          navigate("/dashboard");
        }
      } else {
        setErrors({
          server:
            response.data.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
        });
        toast({
          title: "Lỗi đăng nhập",
          description:
            response.data.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Không thể kết nối đến máy chủ API."
        : "Đã xảy ra lỗi không xác định.";

      setErrors({ server: errorMessage });
      toast({
        title: "Lỗi hệ thống",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (idToken: string) => {
    setErrors({});
    setIsGoogleLoading(true);
    try {
      // Gửi ID Token đến backend để xác thực và đăng nhập
      const response = await axios.post(
        `${API_BASE_URL}/login-google`, // Giả định endpoint cho Google Login
        { idToken },
        { withCredentials: true }
      );

      if (response.data.success) {
        localStorage.setItem("userRole", response.data.role || "admin");
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
          variant: "default",
        });

        // Logic chuyển hướng
        if (response.data.websites && response.data.websites.length === 0) {
          navigate("/add-web");
        } else {
          navigate("/dashboard");
        }
      } else {
        setErrors({
          server:
            response.data.message ||
            "Đăng nhập Google thất bại. Vui lòng thử lại.",
        });
        toast({
          title: "Lỗi đăng nhập Google",
          description:
            response.data.message ||
            "Đăng nhập Google thất bại. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Không thể kết nối đến máy chủ API."
        : "Đã xảy ra lỗi không xác định.";

      setErrors({ server: errorMessage });
      toast({
        title: "Lỗi hệ thống",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    toast({
      title: "Lỗi",
      description: "Đăng nhập Google không thành công. Vui lòng thử lại.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl">
        {/* "Cái gì mới nhất" Section (Left Side) */}
        <div className="hidden md:block md:w-1/2">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-sm mx-auto">
            {/* Header with Parrot and Green Curve */}
            <div className="relative pt-12 px-6">
              {/* Green Curve (Simulated) - Change to primary color for Vaway theme */}
              <div className="absolute top-0 right-0 w-24 h-16 bg-primary rounded-bl-full"></div>

              {/* Vaway Logo */}
              <div className="absolute top-0 left-0 p-4">
                <img src={logo} alt="Vaway Logo" className="h-12 w-auto" />
              </div>

              <h3 className="text-sm font-semibold text-primary mt-16">
                TIN TỨC LIVECHAT
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* News Item 1 */}
              <div>
                <h4 className="text-xl font-bold text-gray-800">
                  Ra mắt tính năng Chatbot AI 2.0
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Thứ Hai, 08 Thg 9, 2025
                </p>
                <p className="text-sm text-gray-600">
                  Chatbot AI thế hệ mới được nâng cấp với khả năng hiểu ngữ cảnh
                  sâu hơn, giúp tự động trả lời 90% câu hỏi thường gặp của khách
                  hàng, giải phóng nhân viên hỗ trợ.
                </p>
              </div>

              {/* News Item 2 */}
              <div>
                <h4 className="text-xl font-bold text-gray-800">
                  Livechat hỗ trợ khách truy cập theo thời gian thực
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Thứ Tư, 27 Thg 8, 2025
                </p>
                <p className="text-sm text-gray-600">
                  Livechat được gắn trực tiếp trên website, giúp bạn trò chuyện
                  và hỗ trợ khách truy cập ngay lập tức. Khách hỏi – bạn nhận
                  tin ngay, không bỏ lỡ bất kỳ cơ hội nào.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form Section (Right Side) */}
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary p-3">
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>
              Đăng nhập để quản lý livechat của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <GoogleLoginButton
	              onSuccess={handleGoogleLoginSuccess}
	              onError={handleGoogleLoginError}
	              disabled={loading || isGoogleLoading}
	            />
	            <div className="relative my-6">
	              <div className="absolute inset-0 flex items-center">
	                <span className="w-full border-t" />
	              </div>
	              <div className="relative flex justify-center text-xs uppercase">
	                <span className="bg-card px-2 text-muted-foreground">
	                  Hoặc tiếp tục với
	                </span>
	              </div>
	            </div> */}
            <form onSubmit={handleLogin} className="space-y-4">
              {errors.server && (
                <div className="text-sm text-center text-red-500 p-2 border border-red-500 rounded-md">
                  {errors.server}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0901234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
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
                    className="pr-10" // Thêm padding bên phải để không che mất icon
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Nhớ mật khẩu
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || isGoogleLoading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
