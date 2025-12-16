// src/App.tsx
import { AuthProvider } from "./context/AuthContext";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ListingDetail from "./pages/ListingDetail";
import ProductNew from "./pages/ProductNew";
import Game from "./pages/Game";
import MyPage from "./pages/MyPage";
import SearchResults from "./pages/SearchResults";
import CategoriesPage from "./pages/Categories";
import HotFeed from "./pages/HotFeed";
import NewFeed from "./pages/NewFeed";
import RecommendFeed from "./pages/RecommendFeed";
import ProfileEdit from "./pages/ProfileEdit";
import UserInfoEdit from "./pages/UserInfoEdit";
import ProductEdit from "./pages/ProductEdit";
import ChatPage from "./pages/Chat";
import UserProfile from "./pages/UserProfile";
import FindId from "./pages/FindId";
import FindPassword from "./pages/FindPassword";
import Shop from "./pages/Shop";
import { GameProvider } from "./context/GameContext";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthProvider>
        <GameProvider>
        <Header />
        <main className="flex-1">
          <Routes>
            {/* 공개 페이지 */}
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/find-id" element={<FindId />} />
            <Route path="/find-password" element={<FindPassword />} />
            <Route path="/sell" element={<ProductNew />} />
            <Route path="/game" element={<Game />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/user/edit" element={<UserInfoEdit />} />
            <Route path="/listing/:id/edit" element={<ProductEdit />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/feed/hot" element={<HotFeed />} />
            <Route path="/feed/new" element={<NewFeed />} />
            <Route path="/feed/recommend" element={<RecommendFeed />} />
          </Routes>
        </main>
        <Footer />
        </GameProvider>
      </AuthProvider>
    </div>
  );
}
