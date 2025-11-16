import { useState, useEffect } from "react";
import { Check, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function WebsiteSelector() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: "", domain: "" });

  const { toast } = useToast();

  // --------------------------
  // 1️⃣ Load websites từ localStorage
  // --------------------------
  useEffect(() => {
    const saved = localStorage.getItem("websites");
    const savedSelected = localStorage.getItem("selectedWebsite");

    let list = [];
    if (saved) {
      list = JSON.parse(saved);
    }

    setWebsites(list);

    // Nếu có website đã chọn → load
    if (savedSelected) {
      const obj = JSON.parse(savedSelected);
      setSelectedWebsite(obj);
    } else if (list.length > 0) {
      // Nếu chưa chọn → tự chọn website đầu tiên
      setSelectedWebsite(list[0]);
      localStorage.setItem("selectedWebsite", JSON.stringify(list[0]));
    }
  }, []);

  // --------------------------
  // 2️⃣ Chọn website và lưu vào localStorage
  // --------------------------
  const handleSelectWebsite = (website) => {
    setSelectedWebsite(website);
    localStorage.setItem("selectedWebsite", JSON.stringify(website));
  };

  // --------------------------
  // 3️⃣ Thêm website mới → lưu vào local
  // --------------------------
  const handleAddWebsite = () => {
    if (!newWebsite.name || !newWebsite.domain) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: newWebsite.name,
      domain: newWebsite.domain,
      isActive: true,
    };

    const updated = [...websites, newItem];

    setWebsites(updated);

    // Lưu vào local
    localStorage.setItem("websites", JSON.stringify(updated));
    localStorage.setItem("selectedWebsite", JSON.stringify(newItem));
    setSelectedWebsite(newItem);

    toast({
      title: "Thêm website thành công",
      description: `Đã thêm ${newWebsite.name}`,
    });

    setIsDialogOpen(false);
    setNewWebsite({ name: "", domain: "" });
  };

  if (!selectedWebsite) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="max-w-[200px] truncate">
              {selectedWebsite.name}
            </span>
            <Badge
              variant={selectedWebsite.isActive ? "default" : "secondary"}
              className="ml-2"
            >
              {selectedWebsite.isActive ? "Hoạt động" : "Tắt"}
            </Badge>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[300px]">
          {websites.map((website) => (
            <DropdownMenuItem
              key={website.id}
              onClick={() => handleSelectWebsite(website)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{website.name}</span>
                <span className="text-xs text-muted-foreground">
                  {website.domain}
                </span>
              </div>

              {selectedWebsite.id === website.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm website
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog thêm website */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm website mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin website để tạo livechat mới
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên website</Label>
              <Input
                id="name"
                placeholder="Ví dụ: Website bán hàng"
                value={newWebsite.name}
                onChange={(e) =>
                  setNewWebsite({ ...newWebsite, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Tên miền</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={newWebsite.domain}
                onChange={(e) =>
                  setNewWebsite({ ...newWebsite, domain: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddWebsite}>Thêm website</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
