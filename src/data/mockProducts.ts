// src/data/mockProducts.ts
// 더 이상 목업 데이터를 생성하지 않고, 서버와 동일한 구조의 Product 타입만 정의

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  status: "selling" | "reserved" | "sold";
  createdAt: string;
  updatedAt: string;
  seller: string;
  isLiked?: boolean; // 현재 사용자가 좋아요했는지 여부
  likeCount?: number; // 좋아요 개수 (판매자에게만 표시)
  shareCount?: number;
  sellerProfileImage?: string;
  sellerUserId?: string;
}

// 더 이상 mockProducts 배열은 사용하지 않음
// 실제 데이터는 API(/api/products)로부터 fetch하여 사용합니다.
