# Hồ sơ sức khỏe (Family Health Record)

Ứng dụng web riêng tư để lưu trữ hồ sơ khám bệnh của bản thân và gia đình qua
từng lần thăm khám. Đăng nhập bằng email + mã OTP, phân quyền chặt chẽ ở tầng
cơ sở dữ liệu, và lưu file (kết quả xét nghiệm, toa thuốc, hóa đơn…) an toàn.

## Tính năng

- **Đăng nhập bằng email + OTP** (mã 6 số gửi qua email). Chỉ những email đã
  được cấp quyền mới đăng nhập được.
- **Admin (bạn)**: xem tất cả, toàn quyền thêm/sửa/xóa, và chia sẻ từng lần
  khám cho email người khác.
- **Người xem**: chỉ đọc những lần khám được chia sẻ với email của họ.
- **Dòng thời gian** theo tháng/năm; mỗi thẻ hiển thị ngày, bệnh viện, chuyên
  khoa, chẩn đoán; lọc theo từng thành viên.
- **Chi tiết lần khám** với các tab: Xét nghiệm & CĐHA, Toa thuốc, Phiếu khám
  bệnh, Hóa đơn, Giấy tờ khác — mỗi tab lưu ảnh/PDF.
- **Giao diện mobile** với thanh điều hướng dưới cùng (bottom navigation).
- **Bảo mật**: Row Level Security trên Postgres + bucket lưu file ở chế độ
  private, tải xuống qua signed URL có thời hạn.

## Công nghệ

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Auth OTP + Postgres
+ Storage) · triển khai trên Vercel.

## Thiết lập

### 1. Tạo project Supabase

1. Vào [supabase.com](https://supabase.com) → **New project**. Ghi lại mật khẩu
   database.
2. Mở **Project Settings → API** và lấy 3 giá trị:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (bí mật — chỉ dùng ở server)

### 2. Tạo schema và chính sách bảo mật

1. Mở **SQL Editor** trong Supabase.
2. Dán toàn bộ nội dung `supabase/migrations/0001_init.sql` và **Run**. Lệnh này
   tạo bảng, bật RLS, và tạo bucket `health-docs` (private).
3. Mở `supabase/seed.sql`, đổi email thành **email admin của bạn**, dán vào SQL
   Editor và **Run** để tự cấp quyền admin.

### 3. Cấu hình đăng nhập OTP

Trong Supabase → **Authentication**:

- **Providers → Email**: bật **Email**. Bật **Confirm email**. (Không cần bật
  đăng ký công khai — ứng dụng dùng `shouldCreateUser: false` nên chỉ tài khoản
  đã tạo mới nhận mã.)
- **Email Templates → Magic Link**: để người dùng nhận **mã OTP** thay vì link,
  sửa template dùng biến `{{ .Token }}` (ví dụ: `Mã đăng nhập của bạn là: {{ .Token }}`).
- Tạo sẵn tài khoản admin: **Authentication → Users → Add user**, nhập email
  admin của bạn và bật *Auto Confirm User*. (Người xem sẽ được tạo tự động khi
  bạn chia sẻ một lần khám cho email của họ.)

> Mặc định Supabase gửi email qua hạ tầng dùng chung với giới hạn thấp. Để dùng
> thật ổn định, cấu hình **SMTP riêng** trong Authentication → Email settings.

### 4. Chạy ở máy local

```bash
cp .env.example .env.local     # rồi điền 3 giá trị từ bước 1
npm install
npm run dev
```

Mở http://localhost:3000, đăng nhập bằng email admin.

### 5. Triển khai lên Vercel

1. Push repo lên GitHub.
2. Vào [vercel.com](https://vercel.com) → **Import Project** từ repo này.
3. Thêm 3 biến môi trường (giống `.env.example`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Deploy**. Sau khi có domain, thêm domain đó vào Supabase →
   **Authentication → URL Configuration → Redirect URLs / Site URL**.

## Mô hình bảo mật (tóm tắt)

- Mọi bảng bật **Row Level Security**. Admin (email nằm trong bảng `admins`) có
  toàn quyền; người dùng thường chỉ `SELECT` được lần khám có bản ghi trong
  `access_grants` khớp email của họ.
- File nằm trong bucket **private** `health-docs`. Ứng dụng chỉ tạo **signed
  URL** ngắn hạn sau khi RLS đã xác nhận người dùng được phép xem.
- `service_role` key chỉ dùng phía server (upload / ký URL), không bao giờ lộ
  ra trình duyệt.

## Cấu trúc thư mục

```
app/
  (auth)/login, (auth)/verify   — đăng nhập OTP
  (app)/                        — timeline, chi tiết, hồ sơ, chia sẻ, tài khoản
  (app)/actions.ts              — server actions (mọi thao tác ghi + upload)
components/                     — UI (Nav, thẻ timeline, tabs, form…)
lib/supabase/                   — client trình duyệt / server / service-role
lib/                            — kiểu dữ liệu, cấu hình tab, tiện ích
supabase/migrations/0001_init.sql — schema + RLS + storage
supabase/seed.sql              — cấp quyền admin
middleware.ts                  — làm mới phiên + chặn route chưa đăng nhập
```
