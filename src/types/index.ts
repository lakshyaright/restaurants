export type RestaurantStatus = 'draft' | 'published' | 'suspended';
export type MemberRole = 'owner' | 'manager';
export type DietaryType = 'veg' | 'non_veg' | 'egg' | 'vegan';

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  opening_hours: WeeklySchedule | null;
  currency: string;
  default_language: string;
  dietary_preference: string;
  status: RestaurantStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  image_url: string | null;
  dietary_type: DietaryType;
  allergens: string[];
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformAdmin {
  user_id: string;
  created_at: string;
}

export interface AdminStats {
  totalRestaurants: number;
  publishedRestaurants: number;
  draftRestaurants: number;
  suspendedRestaurants: number;
  totalCategories: number;
  totalMenuItems: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  order_number: string;
  table_number: string;
  customer_name?: string | null;
  notes?: string | null;
  total_amount: number;
  status: OrderStatus;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}
