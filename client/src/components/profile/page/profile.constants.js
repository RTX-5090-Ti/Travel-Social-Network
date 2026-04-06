export const BIO_MAX_LENGTH = 160;

export const LOCATION_OPTIONS = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Điện Biên",
  "Đắk Lắk",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hồ Chí Minh",
  "Hưng Yên",
  "Huế",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

export const TRAVEL_STYLE_OPTIONS = [
  {
    key: "solo_explorer",
    label: "Solo Explorer",
    description: "Thích đi một mình, tận hưởng hành trình theo nhịp riêng.",
  },
  {
    key: "food_hunter",
    label: "Food Hunter",
    description: "Ưu tiên khám phá món ngon và quán địa phương.",
  },
  {
    key: "nature_lover",
    label: "Nature Lover",
    description: "Yêu thiên nhiên, cảnh đẹp và không khí thư giãn.",
  },
  {
    key: "culture_seeker",
    label: "Culture Seeker",
    description: "Thích tìm hiểu văn hóa, lịch sử và đời sống bản địa.",
  },
  {
    key: "adventure_seeker",
    label: "Adventure Seeker",
    description: "Hứng thú với trải nghiệm mới và hoạt động thử thách.",
  },
  {
    key: "luxury_traveler",
    label: "Luxury Traveler",
    description: "Ưa chuộng chuyến đi chỉn chu, thoải mái và tinh tế.",
  },
  {
    key: "beach_lover",
    label: "Beach Lover",
    description: "Thích biển xanh, nắng đẹp và không khí nghỉ dưỡng.",
  },
  {
    key: "city_wanderer",
    label: "City Wanderer",
    description: "Thích dạo phố, khám phá nhịp sống và góc nhỏ đô thị.",
  },
];

export const TRAVEL_STYLE_KEYS = TRAVEL_STYLE_OPTIONS.map((item) => item.key);

const TRAVEL_STYLE_MAP = TRAVEL_STYLE_OPTIONS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

export function getTravelStyleMeta(styleKey = "") {
  return TRAVEL_STYLE_MAP[styleKey] || null;
}

export function getProfileBioText({ bio = "", isVisitorProfile = false }) {
  const normalizedBio = typeof bio === "string" ? bio.trim() : "";

  if (normalizedBio) return normalizedBio;

  return isVisitorProfile
    ? "Nơi lưu giữ những câu chuyện và kỷ niệm trên hành trình du lịch."
    : "Không gian riêng tư dành cho những câu chuyện và kỷ niệm du lịch của bạn.";
}

export function getProfileLocationText(location = "") {
  const normalizedLocation =
    typeof location === "string" ? location.trim() : "";

  return normalizedLocation || "Chưa cập nhật";
}

export function getProfileTravelStyleText(travelStyle = "") {
  return getTravelStyleMeta(travelStyle)?.label || "Chưa cập nhật";
}
