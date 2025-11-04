# Tháp Xếp Từ Vựng - Trò Chơi Luyện Phát Âm

Trò chơi luyện phát âm 3D được xây dựng với React, React Three Fiber và công cụ vật lý Rapier. Người chơi xây dựng tháp bằng cách "phát âm" các đoạn văn bản, với chất lượng phát âm khác nhau ảnh hưởng đến vật lý và độ ổn định của các khối.

## 🎮 Tính Năng Trò Chơi

### Lối Chơi Cốt Lõi
- **Mô Phỏng Phát Âm**: Nhấn A (Hoàn hảo), S (Tạm được), hoặc D (Thất bại) để mô phỏng chất lượng phát âm
- **Xây Tháp Dựa Trên Vật Lý**: Mỗi khối có thuộc tính vật lý thực tế dựa trên chất lượng phát âm
- **Hệ Thống Combo**: Đạt 3 lần phát âm hoàn hảo liên tiếp để kích hoạt chế độ combo với độ ổn định tăng cường
- **Sụp Đổ Tháp**: Phát âm kém tạo ra các khối không ổn định có thể khiến toàn bộ tháp đổ

### Hiệu Ứng Hình Ảnh & Âm Thanh
- **Đồ Họa 3D**: Môi trường 3D sống động với ánh sáng và bóng đổ động
- **Hiệu Ứng Khối**: Màu sắc phát sáng và thuộc tính vật lý khác nhau cho mỗi chất lượng phát âm
- **Rung Màn Hình**: Hiệu ứng sụp đổ ấn tượng với rung camera
- **Phản Hồi Âm Thanh**: Hiệu ứng âm thanh tự động cho mỗi loại hành động
- **Aura Combo**: Hiệu ứng phát sáng trong chế độ combo

### Thành Phần Giao Diện
- **HUD Trên**: Điểm số, số lượng khối, đồng hồ đếm ngược và chỉ báo combo
- **Giao Diện Dưới**: Lời nhắc từ hiện tại, thanh độ trôi chảy, văn bản phản hồi và hướng dẫn điều khiển
- **Màn Hình Kết Thúc**: Hiển thị điểm cuối với tùy chọn chơi lại

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống
- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn

### Cài Đặt

1. Sao chép hoặc tải xuống các tệp dự án
2. Cài đặt các phụ thuộc:
```bash
npm install
```

3. Khởi động máy chủ phát triển:
```bash
npm start
```

4. Mở [http://localhost:3000](http://localhost:3000) để chơi trò chơi

## 🎯 Cách Chơi

1. **Bắt Đầu**: Nhấn bất kỳ phím nào (A, S, hoặc D) để bắt đầu
2. **Xây Dựng**: Sử dụng đầu vào bàn phím để thêm khối:
   - **Phím A**: Phát âm hoàn hảo (✅) - Khối ổn định, căn giữa (+100 điểm)
   - **Phím S**: Vấn đề nhỏ (⚠️) - Khối hơi nghiêng (+50 điểm)  
   - **Phím D**: Phát âm kém (❌) - Khối nghiêng nhiều, lệch vị trí (+0 điểm)
3. **Combo**: Đạt 3 lần phát âm hoàn hảo liên tiếp cho chế độ combo (+150 điểm mỗi khối hoàn hảo)
4. **Sinh Tồn**: Giữ tháp ổn định - nếu nghiêng quá nhiều, nó sẽ đổ!
5. **Ghi Điểm**: Xây cao nhất có thể trong giới hạn thời gian 2 phút

## 🛠 Technical Architecture

### Technologies Used
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe development
- **React Three Fiber**: React renderer for Three.js
- **@react-three/rapier**: Physics engine integration
- **@react-three/drei**: Useful helpers for R3F

### Project Structure
```
src/
├── components/
│   ├── GameContainer.tsx     # Main game logic and state management
│   ├── TopHud.tsx           # Score, timer, combo display
│   ├── BottomUi.tsx         # Input controls and feedback
│   ├── TowerStackScene.tsx  # 3D scene setup and physics world
│   └── TowerBlock.tsx       # Individual block physics and rendering
├── hooks/
│   ├── useGameState.ts      # Game state management
│   └── useAudio.ts          # Audio effects system
├── types/
│   └── game.ts              # TypeScript type definitions
└── App.tsx                  # Root application component
```

### Key Features Implementation

#### Physics System
- Each block is a Rapier RigidBody with realistic collision detection
- Block stability affects tower integrity
- Rotation thresholds trigger collapse events

#### Audio System
- Procedural audio generation using Web Audio API
- Different tones for each pronunciation quality
- Combo and collapse sound effects

#### Visual Effects
- Dynamic camera that follows tower height
- Glow effects for new blocks
- Screen shake during collapse
- Combo aura lighting effects

## 🎨 Customization

### Adding New Chunks
Edit the `CHUNKS` array in `src/hooks/useGameState.ts`:
```typescript
const CHUNKS = [
  "Your custom phrase",
  "Another practice sentence",
  // Add more chunks here
];
```

### Adjusting Physics
Modify block properties in `src/components/TowerBlock.tsx`:
- Rotation angles for different pronunciation qualities
- Position offsets for failure blocks
- Stability thresholds

### Visual Styling
- Colors and effects can be modified in component style objects
- 3D lighting and materials in `TowerStackScene.tsx`
- UI styling in individual component files

## 📱 Browser Compatibility

- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (with touch controls for A/S/D inputs)

## 🔧 Development

### Available Scripts
- `npm start`: Development server
- `npm build`: Production build
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

### Performance Notes
- Physics calculations are optimized for 60fps
- Block count affects performance (recommended max: ~20 blocks)
- Audio context is created on-demand to avoid browser restrictions

## 🎓 Educational Use

This game demonstrates:
- 3D physics simulation in web browsers
- React integration with Three.js
- Real-time audio generation
- Game state management patterns
- TypeScript in React applications

Perfect for learning modern web development with 3D graphics and physics!