import {
  HomeIcon,
  GridIcon,
  BookmarkIcon,
  SendIcon,
  SettingsIcon,
} from "./feed.icons";

export const stories = [
  {
    id: 1,
    name: "Gladys",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    ring: "from-cyan-400 via-yellow-400 to-pink-500",
  },
  {
    id: 2,
    name: "Kristin",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    ring: "from-blue-500 via-violet-500 to-pink-500",
  },
  {
    id: 3,
    name: "Priscilla",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    ring: "from-orange-400 via-pink-500 to-red-500",
  },
  {
    id: 4,
    name: "Connie",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    ring: "from-fuchsia-500 via-rose-500 to-orange-400",
  },
  {
    id: 5,
    name: "Brandie",
    avatar:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
    ring: "from-yellow-400 via-red-400 to-purple-500",
  },
  {
    id: 6,
    name: "Lily",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    ring: "from-orange-400 via-rose-500 to-blue-500",
  },
];

export const requests = [
  {
    id: 1,
    name: "Lauralee Quintero",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: 2,
    name: "Brittni Landoma",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80",
  },
];

export const suggestions = [
  {
    id: 1,
    name: "Chantal Shelburne",
    city: "Memphis, TN, US",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    dot: "bg-red-400",
  },
  {
    id: 2,
    name: "Marci Senter",
    city: "Newark, NJ, US",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    dot: "bg-emerald-400",
  },
  {
    id: 3,
    name: "Janetta Rotolo",
    city: "Fort Worth, TX, US",
    avatar:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=160&q=80",
    dot: "bg-yellow-400",
  },
  {
    id: 4,
    name: "Tyra Dhillon",
    city: "Springfield, MA, US",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=160&q=80",
    dot: "bg-orange-400",
  },
  {
    id: 5,
    name: "Marielle Wigington",
    city: "Honolulu, HI, US",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    dot: "bg-orange-400",
  },
];

export const contacts = [
  {
    id: 1,
    name: "Julie Mendez",
    city: "Memphis, TN, US",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    dot: "bg-blue-500",
  },
  {
    id: 2,
    name: "Marian Montgomery",
    city: "Newark, NJ, US",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    dot: "bg-emerald-400",
  },
  {
    id: 3,
    name: "Joyce Reid",
    city: "Fort Worth, TX, US",
    avatar:
      "https://images.unsplash.com/photo-1506863530036-1efeddceb993?auto=format&fit=crop&w=160&q=80",
    dot: "bg-red-400",
  },
  {
    id: 4,
    name: "Alice Franklin",
    city: "Springfield, MA, US",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    dot: "bg-sky-400",
  },
  {
    id: 5,
    name: "Domingo Flores",
    city: "Honolulu, HI, US",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    dot: "bg-orange-400",
  },
];

export const navItems = [
  { id: 1, label: "Feed", active: true, icon: GridIcon },
  { id: 2, label: "Home", active: false, icon: HomeIcon },
  { id: 3, label: "My favorites", active: false, icon: BookmarkIcon },
  { id: 4, label: "Direct", active: false, icon: SendIcon },
  { id: 5, label: "Settings", active: false, icon: SettingsIcon },
];

export const shapeStyles = [
  { animationDelay: "0s", animationDuration: "18s" },
  { animationDelay: "2s", animationDuration: "22s" },
  { animationDelay: "4s", animationDuration: "20s" },
  { animationDelay: "1s", animationDuration: "24s" },
  { animationDelay: "3s", animationDuration: "26s" },
];
