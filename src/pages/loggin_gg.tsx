import React from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc"; // Giả định đã có react-icons hoặc cần cài đặt

// Do không thể cài đặt thư viện Google OAuth thực tế trong môi trường này,
// chúng ta sẽ tạo một component giả định.
// Trong môi trường thực tế, bạn sẽ sử dụng thư viện như @react-oauth/google
// và logic sẽ nằm trong hàm `onSuccess` của GoogleLogin component.

interface GoogleLoginButtonProps {
  onSuccess: (token: string) => void;
  onError: () => void;
  disabled: boolean;
}

// Component giả định cho nút đăng nhập Google
const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled,
}) => {
  // Trong môi trường thực tế, logic này sẽ được thay thế bằng
  // việc gọi GoogleLogin component từ thư viện @react-oauth/google
  const handleGoogleLogin = () => {
    if (disabled) return;

    // *** GIẢ ĐỊNH: Gọi API Google và nhận được ID Token ***
    // Thay thế bằng logic thực tế của Google Sign-In
    console.log("Simulating Google Sign-In...");

    // Giả định thành công sau 500ms và trả về một token giả
    setTimeout(() => {
      const mockGoogleIdToken = "MOCK_GOOGLE_ID_TOKEN_FOR_BACKEND_VERIFICATION";
      onSuccess(mockGoogleIdToken);
    }, 500);

    // Nếu thất bại, gọi onError()
    // onError();
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleLogin}
      disabled={disabled}
    >
      {/* Giả định FcGoogle là một icon đã được import */}
      {/* Trong thực tế, bạn cần đảm bảo react-icons đã được cài đặt */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="20px"
        height="20px"
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.158,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.158,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,38.807,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
      Đăng nhập với Google
    </Button>
  );
};

export default GoogleLoginButton;
